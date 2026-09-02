export class AppResponse<T = any> {
  public readonly success: boolean = true;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T | null;

  constructor(statusCode: number, message: string, data: T | null = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  /**
   * Helper for standard 200 OK responses
   */
  static success<T>(message: string, data: T | null = null): AppResponse<T> {
    return new AppResponse<T>(200, message, data);
  }

  /**
   * Helper for standard 201 Created responses
   */
  static created<T>(message: string, data: T | null = null): AppResponse<T> {
    return new AppResponse<T>(201, message, data);
  }
}
