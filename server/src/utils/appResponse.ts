export class AppResponse<T = any> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T | null;

  constructor(
    statusCode: number,
    message: string,
    data: T | null = null,
    success: boolean = true
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  /**
   * Standard 200 OK response
   */
  static success<T>(
    message: string,
    data: T | null = null
  ): AppResponse<T> {
    return new AppResponse<T>(
      200,
      message,
      data,
      true
    );
  }

  /**
   * Standard 201 Created response
   */
  static created<T>(
    message: string,
    data: T | null = null
  ): AppResponse<T> {
    return new AppResponse<T>(
      201,
      message,
      data,
      true
    );
  }

  /**
   * Standard error response
   */
  static error(
    statusCode: number,
    message: string
  ): AppResponse<null> {
    return new AppResponse<null>(
      statusCode,
      message,
      null,
      false
    );
  }
}
