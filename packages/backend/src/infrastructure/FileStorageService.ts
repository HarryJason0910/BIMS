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
   * Get folder path for a company and role
   */
  private getFolderPath(company: string, role: string): string {
    const folderName = `${this.sanitizeFolderName(company)}_${this.sanitizeFolderName(role)}`;
    return path.join(this.baseDir, folderName);
  }

  /**
   * Save resume PDF file
   * Returns the relative file path
   */
  async saveResume(company: string, role: string, fileBuffer: Buffer): Promise<string> {
    const folderPath = this.getFolderPath(company, role);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, 'resume.pdf');
    fs.writeFileSync(filePath, fileBuffer);

    // Return relative path
    return path.relative(this.baseDir, filePath);
  }

  /**
   * Save job description as text file
   * Returns the relative file path
   */
  async saveJobDescription(company: string, role: string, content: string): Promise<string> {
    const folderPath = this.getFolderPath(company, role);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, 'JD.txt');
    fs.writeFileSync(filePath, content, 'utf-8');

    // Return relative path
    return path.relative(this.baseDir, filePath);
  }

  /**
   * Read resume file
   */
  async readResume(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Resume file not found: ${relativePath}`);
    }
    return fs.readFileSync(fullPath);
  }

  /**
   * Read job description file
   */
  async readJobDescription(relativePath: string): Promise<string> {
    const fullPath = path.join(this.baseDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Job description file not found: ${relativePath}`);
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
}
