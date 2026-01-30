import * as fs from 'fs';
import * as path from 'path';

/**
 * Service for managing file storage with folder structure
 * Folder structure: CompanyName_Role/
 * Files: resume.pdf, JD.txt
 */
export class FileStorageService {
  private readonly baseDir: string;

  constructor(baseDir: string = './uploads') {
    this.baseDir = baseDir;
    this.ensureBaseDirectory();
  }

  private ensureBaseDirectory(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Sanitize folder name by removing invalid characters
   */
  private sanitizeFolderName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  /**
   * Get folder path for a company, role, and stacks
   */
  private getFolderPath(company: string, role: string, mainStacks?: string[]): string {
    const sanitizedCompany = this.sanitizeFolderName(company);
    const sanitizedRole = this.sanitizeFolderName(role);
    
    // Add stacks to folder name if provided
    let folderName = `${sanitizedCompany}_${sanitizedRole}`;
    if (mainStacks && mainStacks.length > 0) {
      const stacksStr = mainStacks.map(s => this.sanitizeFolderName(s)).join('_');
      folderName = `${sanitizedCompany}_${sanitizedRole}_${stacksStr}`;
    }
    
    return path.join(this.baseDir, folderName);
  }

  /**
   * Save resume PDF file
   * Returns the absolute file path
   */
  async saveResume(company: string, role: string, fileBuffer: Buffer, mainStacks?: string[]): Promise<string> {
    const folderPath = this.getFolderPath(company, role, mainStacks);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, 'resume.pdf');
    fs.writeFileSync(filePath, fileBuffer);

    // Return absolute path
    return path.resolve(filePath);
  }

  /**
   * Save job description as text file
   * Returns the absolute file path
   */
  async saveJobDescription(company: string, role: string, content: string, mainStacks?: string[]): Promise<string> {
    const folderPath = this.getFolderPath(company, role, mainStacks);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, 'JD.txt');
    fs.writeFileSync(filePath, content, 'utf-8');

    // Return absolute path
    return path.resolve(filePath);
  }

  /**
   * Read resume file
   * Handles both relative paths (from uploaded resumes) and absolute paths (from selected resumes)
   */
  async readResume(filePath: string): Promise<Buffer> {
    // Check if path is absolute (selected from history) or relative (uploaded with bid)
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Resume file not found: ${filePath}`);
    }
    return fs.readFileSync(fullPath);
  }

  /**
   * Read job description file
   * Handles both relative paths (from uploaded JDs) and absolute paths (from selected resumes)
   */
  async readJobDescription(filePath: string): Promise<string> {
    // Check if path is absolute or relative
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Job description file not found: ${filePath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * Delete files for a company and role
   */
  async deleteFiles(company: string, role: string): Promise<void> {
    const folderPath = this.getFolderPath(company, role);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
  }

  /**
   * Check if resume file exists
   */
  fileExists(relativePath: string): boolean {
    const fullPath = path.join(this.baseDir, relativePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Find candidate resumes based on stack matching
   * Returns list of resumes with matching stacks
   */
  async findCandidateResumes(targetStacks: string[]): Promise<Array<{
    folderName: string;
    resumePath: string;
    matchingStacks: string[];
    matchCount: number;
  }>> {
    const candidates: Array<{
      folderName: string;
      resumePath: string;
      matchingStacks: string[];
      matchCount: number;
    }> = [];

    if (!fs.existsSync(this.baseDir)) {
      return candidates;
    }

    // Read all folders in base directory
    const folders = fs.readdirSync(this.baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Normalize target stacks for comparison
    const normalizedTargetStacks = targetStacks.map(s => s.toLowerCase());

    for (const folder of folders) {
      // Extract stacks from folder name (format: Company_Role_Stack1_Stack2_...)
      const parts = folder.split('_');
      if (parts.length < 3) continue; // Need at least Company_Role_Stack

      // Stacks are everything after company and role
      const folderStacks = parts.slice(2).map(s => s.toLowerCase());
      
      // Find matching stacks
      const matchingStacks = folderStacks.filter(stack => 
        normalizedTargetStacks.some(targetStack => 
          stack.includes(targetStack) || targetStack.includes(stack)
        )
      );

      if (matchingStacks.length > 0) {
        const resumePath = path.join(folder, 'resume.pdf');
        const fullResumePath = path.join(this.baseDir, resumePath);
        
        // Only include if resume file exists
        if (fs.existsSync(fullResumePath)) {
          candidates.push({
            folderName: folder,
            resumePath,
            matchingStacks,
            matchCount: matchingStacks.length
          });
        }
      }
    }

    // Sort by match count (descending)
    candidates.sort((a, b) => b.matchCount - a.matchCount);

    return candidates;
  }
}
