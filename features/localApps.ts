/**
 * @description
 * This file contains the configuration for locally installed applications
 * that the AI assistant can open using custom URL schemes.
 *
 * To add a new application:
 * 1. Find the application's custom URL scheme (e.g., 'vscode://', 'spotify:').
 *    You can often find this by searching online for "[Application Name] URL scheme".
 * 2. Add a new object to the `localApps` array below.
 *
 * @example
 * {
 *   name: 'Your App Name', // The display name of the application.
 *   commandKeywords: ['keyword1', 'keyword2'], // Voice commands to trigger opening the app.
 *   urlScheme: 'yourappscheme://' // The URL scheme to launch the app.
 * }
 */

export interface LocalApp {
  name:string;
  commandKeywords: string[];
  urlScheme: string;
}

export const localApps: LocalApp[] = [
  {
    name: 'Visual Studio Code',
    commandKeywords: ['vscode', 'code', 'editor', 'visual studio'],
    urlScheme: 'vscode://',
  },
  {
    name: 'Slack',
    commandKeywords: ['slack', 'chat', 'work'],
    urlScheme: 'slack://',
  },
  {
    name: 'Spotify',
    commandKeywords: ['spotify', 'music'],
    urlScheme: 'spotify:',
  },
  {
    name: 'Notion',
    commandKeywords: ['notion', 'notes', 'docs'],
    urlScheme: 'notion:',
  },
  {
    name: 'Figma',
    commandKeywords: ['figma', 'design'],
    urlScheme: 'figma://',
  },
   {
    name: 'Notepad',
    commandKeywords: ['notepad'],
    urlScheme: 'notepad://',
  },
];
