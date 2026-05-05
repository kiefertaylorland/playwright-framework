import { type Page } from '@playwright/test';

import { ROUTES } from '@utils/routes';

export const ERROR_MESSAGES = {
  LOCKED_OUT: 'Epic sadface: Sorry, this user has been locked out.',
  INVALID_CREDENTIALS: 'Epic sadface: Username and password do not match any user in this service',
  USERNAME_REQUIRED: 'Epic sadface: Username is required',
  PASSWORD_REQUIRED: 'Epic sadface: Password is required',
} as const;

export class LoginPage {
  private readonly page: Page;

  private readonly usernameSelector = '[data-test="username"]';
  private readonly passwordSelector = '[data-test="password"]';
  private readonly loginButtonSelector = '[data-test="login-button"]';
  private readonly errorBannerSelector = '[data-test="error"]';

  public constructor(page: Page) {
    this.page = page;
  }

  public async goto(): Promise<void> {
    await this.page.goto(ROUTES.LOGIN);
  }

  public async fillUsername(username: string): Promise<void> {
    await this.page.locator(this.usernameSelector).fill(username);
  }

  public async fillPassword(password: string): Promise<void> {
    await this.page.locator(this.passwordSelector).fill(password);
  }

  public async submit(): Promise<void> {
    await this.page.locator(this.loginButtonSelector).click();
  }

  public async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  public async getErrorMessage(): Promise<string> {
    const text = await this.page.locator(this.errorBannerSelector).textContent();
    return (text ?? '').trim();
  }

  public async isErrorVisible(): Promise<boolean> {
    return this.page.locator(this.errorBannerSelector).isVisible();
  }

  public async isLoginFormVisible(): Promise<boolean> {
    const usernameVisible = await this.page.locator(this.usernameSelector).isVisible();
    const passwordVisible = await this.page.locator(this.passwordSelector).isVisible();
    return usernameVisible && passwordVisible;
  }

  public getCurrentUrl(): string {
    return this.page.url();
  }

  public async getRenderedHtml(): Promise<string> {
    return this.page.content();
  }

  public isOnLoginPage(): Promise<boolean> {
    return Promise.resolve(new URL(this.page.url()).pathname === '/');
  }
}
