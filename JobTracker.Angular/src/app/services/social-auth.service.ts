import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

declare const google: any;
declare const FB: any;

@Injectable({ providedIn: 'root' })
export class SocialAuthService {
  private readonly googleCredential = new Subject<string>();
  private googleInitialized = false;
  private facebookInitialized = false;

  constructor(private readonly zone: NgZone) {}

  onGoogleCredential() {
    return this.googleCredential.asObservable();
  }

  async initGoogleButton(container: HTMLElement): Promise<void> {
    if (!environment.googleClientId) return;

    await this.loadScript('https://accounts.google.com/gsi/client', 'google-identity-script');

    if (!this.googleInitialized) {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: { credential: string }) =>
          this.zone.run(() => this.googleCredential.next(response.credential))
      });
      this.googleInitialized = true;
    }

    google.accounts.id.renderButton(container, { type: 'icon', shape: 'circle', theme: 'outline', size: 'large' });
  }

  triggerGoogle(container: HTMLElement): void {
    const realButton = container.querySelector('div[role="button"]') as HTMLElement | null;
    realButton?.click();
  }

  signInWithFacebook(): Promise<string> {
    return this.loadScript('https://connect.facebook.net/hu_HU/sdk.js', 'facebook-jssdk').then(() => {
      if (!environment.facebookAppId) {
        return Promise.reject(new Error('A Facebook App ID nincs beállítva.'));
      }

      if (!this.facebookInitialized) {
        FB.init({ appId: environment.facebookAppId, cookie: true, xfbml: false, version: 'v19.0' });
        this.facebookInitialized = true;
      }

      return new Promise<string>((resolve, reject) => {
        FB.login((response: any) => {
          this.zone.run(() => {
            if (response.authResponse?.accessToken) {
              resolve(response.authResponse.accessToken);
            } else {
              reject(new Error('A Facebook bejelentkezés megszakadt.'));
            }
          });
        }, { scope: 'email' });
      });
    });
  }

  private loadScript(src: string, id: string): Promise<void> {
    return new Promise(resolve => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }
}
