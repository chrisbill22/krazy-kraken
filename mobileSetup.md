# How to run this on mobile.
## First Time Setup
- Start with installing Capacitor: [Link](https://capacitorjs.com/docs/)
- Create a new Capacitor App `npm init @capacitor/app`
- Use `com.chrisbill.appname`
- cd into the app and run `nom install`
- Install iOS and Android in your App `npm i @capacitor/android @capacitor/ios`
- Add iOS `npx cap add ios` and/or Android `npx cap add android`
- Build the sample app `npm run build`
- Sync the build `npx cap sync`
- Run iOS simulator `npx cap run ios`
- If it's working at this point, move on to the next stpes

## Updating and running
- Copy your game code from `public` into the `dist` folder.
- Sync the build `npx cap sync`
- Run iOS simulator `npx cap run ios`

## Install on your Phone
- Run `npx cap open ios` to open the xcode project
- Select the device and click run
- Make sure you have selected Christopher Bill under the Team dropdown.
