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
   * Get folder path using bid ID (much cleaner and avoids long path issues)
   */
  private getFolderPath(bidId: string): string {
    return path.join(this.baseDir, bidId);
  }

  /**
   * Save resume PDF file using bid ID as folder name
   * Returns the absolute file path
   */
  async saveResume(bidId: string, fileBuffer: Buffer): Promise<string> {
    const folderPath = this.getFolderPath(bidId);
    
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
   * Save job description as text file using bid ID as folder name
   * Returns the absolute file path
   */
  async saveJobDescription(bidId: string, content: string): Promise<string> {
    const folderPath = this.getFolderPath(bidId);
    
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
   * Delete files for a bid ID
   */
  async deleteFiles(bidId: string): Promise<void> {
    const folderPath = this.getFolderPath(bidId);
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
}
