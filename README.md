# vscode-extension-demo

## vscode extension generator tool
* > sudo npm install -g yo generator-code
or 
* > sudo cnpm install -g yo generator-code

## generate a demo
* > yo code
* > ..... {ts or js}
* > ..... {your extension name}
* > ..... {your extension id}
* > ..... {your extension description}
* > ..... {npm or yarn}

then, it will auto run 'npm install' to install dependencies;
you can ctrl+c to stop it, and use cnpm like below:
* > cd ${your extension name}
* > cnpm install 

## run and debug
* open the folder with vscode;
* open src/extension.ts;
* press F5 to run, it will launch a new vscode 'extension development host', the extension will run in this vscode.
* enjoy.

## package and publish to market
[package and publish extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## demos
### node-addon
a demo that show how node call c/c++ 

### hellovscode
view -> command palette -> Hello VSCode
it will show a information dialog in rightbottom

### vscode-typescript-liveview
when open a .ts file, then will open a webview in right side, if you write some ts code for build html, the webview will show it, the code like below:
var p = document.createElement('p');
p.textContent = 'hello';
document.body.appendChild(p);

