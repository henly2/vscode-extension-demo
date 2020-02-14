// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as path from 'path';

var output:vscode.OutputChannel;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-typescript-liveview" is now active!');

	// create a pane with Live code
	output = vscode.window.createOutputChannel('Live View');
	output.show(true);
	output.appendLine('Live Code Started!');

	// try to open...
	if(vscode.window.activeTextEditor){
		var document = vscode.window.activeTextEditor.document;
		TsCodingPanel.createOrShow(context.extensionPath, document);  
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('liveview.previewTypeScript', () => {
		output.appendLine('Execute command preview typescript');

		if(vscode.window.activeTextEditor){
			var document = vscode.window.activeTextEditor.document;
			TsCodingPanel.createOrShow(context.extensionPath, document);  
		} 
	});

	// text changed
	vscode.workspace.onDidChangeTextDocument(event => {
		//handleDocumentTextChanged(event.document);
		//output.appendLine(`change document: ${event.document.uri.path}`);
	});
	// text saved
	vscode.workspace.onDidSaveTextDocument(event => {
		var document = event;
		TsCodingPanel.createOrShow(context.extensionPath, document);  
	});
	// open a new
	vscode.workspace.onDidOpenTextDocument(event => {
		var document = event;
		TsCodingPanel.createOrShow(context.extensionPath, document);  
	});

	// switch exitor
	vscode.window.onDidChangeActiveTextEditor(()=>{
		if(vscode.window.activeTextEditor){
			var document = vscode.window.activeTextEditor.document;
			TsCodingPanel.createOrShow(context.extensionPath, document);  
		}
	})

	context.subscriptions.push(disposable);
}

function GetPreviewUri(uri:vscode.Uri){
    return uri.with({ scheme: 'liveview', path: uri.path, query: uri.toString() });
}

// function showPreview(document:vscode.TextDocument){
// 	var resource = document.uri;
// 	var dynamicHtmlUrl = GetPreviewUri(resource);

// 	return vscode.commands.executeCommand('vscode.previewHtml', 
// 	dynamicHtmlUrl,
// 	vscode.ViewColumn.Three,
// 	`Preview ${path.basename(resource.fsPath)}`
// 	).then(()=>{},(e)=>{
// 		output.appendLine(e)
// 	});
// }

function isTypeScriptFile(document:vscode.TextDocument){
	return document.languageId === 'typescript' && document.uri.scheme !== 'liveview';
}

function compileTypeScript(source:string){
    var tsconfig:ts.CompilerOptions = {
        target: ts.ScriptTarget.ES5
    };
    var compileResult = ts.transpileModule(source, { compilerOptions: tsconfig });
    var javascript = compileResult.outputText;
    var scriptTag = 
    `<script> 
        try{
            eval(${JSON.stringify(javascript)});
        }
        catch(e){
            var error = document.createElement('p');
            error.style.color="#e50";
            error.style.fontSize="larger";
            error.textContent = e;
            document.body.appendChild(error);
        }  
    </script>`;
    return scriptTag;
}

function getHtmlContent(uri: vscode.Uri) : Thenable<string> {
	return vscode.workspace.openTextDocument(vscode.Uri.parse(uri.query)).then(document => {
		const head = [
			'<!DOCTYPE html>',
			'<html>',
			'<head>',
			'<meta http-equiv="Content-type" content="text/html;charset=UTF-8">',
			'</head>',
			'<body>'
		].join('\n');

		const body = compileTypeScript(document.getText());

		const tail = [
			'</body>',
			'</html>'
		].join('\n');

		return head + body + tail;
	});
}

/**
 * Manages ts coding webview panels
 */
class TsCodingPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: TsCodingPanel | undefined;

	public static readonly viewType = 'tsCoding';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionPath: string, document: vscode.TextDocument) {
		if(!isTypeScriptFile(document)){
			return;
		}
		const uri = GetPreviewUri(document.uri);

		const column = vscode.ViewColumn.Two;

		// If we already have a panel, show it.
		if (TsCodingPanel.currentPanel) {
			//TsCodingPanel.currentPanel._panel.reveal(column);
			TsCodingPanel.currentPanel._update(uri);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			TsCodingPanel.viewType,
			`Preview ${path.basename(uri.path)}`,
			column,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `images` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'images'))]
			}
		);

		TsCodingPanel.currentPanel = new TsCodingPanel(panel, extensionPath, uri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string, uri: vscode.Uri) {
		TsCodingPanel.currentPanel = new TsCodingPanel(panel, extensionPath, uri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string, uri: vscode.Uri) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		// Set the webview's initial html content
		this._update(uri);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update(undefined);
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		TsCodingPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update(uri: vscode.Uri | undefined) {
		//const webview = this._panel.webview;
		if(uri){
			this._panel.title = `Preivew ${path.basename(uri.path)}`;
			//this._panel.webview.html = this._getHtmlForWebview(webview, uri);
			getHtmlContent(uri).then(text => {
				this._panel.webview.html = text;
			});
		}	
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
