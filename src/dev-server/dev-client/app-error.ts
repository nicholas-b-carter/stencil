import * as d from '../../declarations';


export function appError(doc: Document, buildResults: d.BuildResults) {
  if (!Array.isArray(buildResults.diagnostics)) {
    return;
  }

  const modal = getDevServerModal(doc);

  buildResults.diagnostics.forEach(diagnostic => {
    consoleLogError(diagnostic);
    appendDiagnostic(doc, modal, diagnostic);
  });
}


function appendDiagnostic(doc: Document, modal: HTMLElement, diagnostic: d.Diagnostic) {
  const card = doc.createElement('div');
  card.className = 'dev-server-diagnostic';

  const masthead = doc.createElement('div');
  masthead.className = 'dev-server-diagnostic-masthead';
  masthead.title = `${escapeHtml(diagnostic.type)} error: ${escapeHtml(diagnostic.code)}`;
  card.appendChild(masthead);

  const title = doc.createElement('div');
  title.className = 'dev-server-diagnostic-title';
  title.textContent = `${titleCase(diagnostic.type)} ${titleCase(diagnostic.level)}`;
  masthead.appendChild(title);

  const message = doc.createElement('div');
  message.className = 'dev-server-diagnostic-message';
  message.textContent = diagnostic.messageText;
  masthead.appendChild(message);

  const file = doc.createElement('div');
  file.className = 'dev-server-diagnostic-file';
  card.appendChild(file);

  if (diagnostic.absFilePath) {
    const fileHeader = doc.createElement('div');
    fileHeader.className = 'dev-server-diagnostic-file-header';
    fileHeader.title = escapeHtml(diagnostic.absFilePath);
    fileHeader.textContent = diagnostic.relFilePath;
    file.appendChild(fileHeader);
  }

  if (diagnostic.lines && diagnostic.lines.length > 0) {
    const blob = doc.createElement('div');
    blob.className = 'dev-server-diagnostic-blob';
    file.appendChild(blob);

    const table = doc.createElement('table');
    table.className = 'dev-server-diagnostic-table';
    file.appendChild(table);

    prepareLines(diagnostic.lines, 'html').forEach(l => {
      const tr = doc.createElement('tr');
      if (l.errorCharStart > -1) {
        tr.className = 'dev-server-diagnostic-error-line';
      }
      table.appendChild(tr);

      const tdNum = doc.createElement('td');
      tdNum.className = 'dev-server-diagnostic-blob-num';
      tdNum.setAttribute('data-line-number', l.lineNumber + '');
      tr.appendChild(tdNum);

      const tdCode = doc.createElement('td');
      tdCode.className = 'dev-server-diagnostic-blob-code';
      tdCode.innerHTML = highlightError(l.html, l.errorCharStart, l.errorLength);
      tr.appendChild(tdCode);
    });
  }

  modal.appendChild(card);
}


function getDevServerModal(doc: Document) {
  let outer = doc.getElementById(DEV_SERVER_MODAL);
  if (!outer) {
    outer = doc.createElement('div');
    outer.id = DEV_SERVER_MODAL;
    doc.body.appendChild(outer);
  }

  outer.innerHTML = `
    <style>#${DEV_SERVER_MODAL} { display: none; }</style>
    <link href="/__dev-server/app-error.css" rel="stylesheet">
    <div id="${DEV_SERVER_MODAL}-inner"></div>
  `;

  return doc.getElementById(`${DEV_SERVER_MODAL}-inner`);
}


function consoleLogError(diagnostic: d.Diagnostic) {
  const msg: string[] = [];

  if (diagnostic.header) {
    msg.push(diagnostic.header);
  }

  if (diagnostic.messageText) {
    msg.push(diagnostic.messageText);
  }

  if (msg.length > 0) {
    console.error(msg.join('\n'));
  }
}


export function clearDevServerModal(doc: Document) {
  const appErrorElm = doc.getElementById(DEV_SERVER_MODAL);
  if (appErrorElm) {
    appErrorElm.parentNode.removeChild(appErrorElm);
  }
}

function escapeHtml(unsafe: string) {
  if (typeof unsafe === 'number' || typeof unsafe === 'boolean') {
    return (unsafe as any).toString();
  }
  if (typeof unsafe === 'string') {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  return '';
}

function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

function highlightError(htmlInput: string, errorCharStart: number, errorLength: number) {
  if (errorCharStart < 0 || errorLength < 1 || !htmlInput) return htmlInput;

  const chars = htmlInput.split('');
  let inTag = false;
  let textIndex = -1;
  for (var htmlIndex = 0; htmlIndex < chars.length; htmlIndex++) {
    if (chars[htmlIndex] === '<') {
      inTag = true;
      continue;

    } else if (chars[htmlIndex] === '>') {
      inTag = false;
      continue;

    } else if (inTag) {
      continue;

    } else if (chars[htmlIndex] === '&') {

      var isValidEscape = true;
      var escapeChars = '&';
      for (var i = htmlIndex + 1; i < chars.length; i++) {
        if (!chars[i] || chars[i] === ' ') {
          isValidEscape = false;
          break;
        } else if (chars[i] === ';') {
          escapeChars += ';';
          break;
        } else {
          escapeChars += chars[i];
        }
      }
      isValidEscape = (isValidEscape && escapeChars.length > 1 && escapeChars.length < 9 && escapeChars[escapeChars.length - 1] === ';');

      if (isValidEscape) {
        chars[htmlIndex] = escapeChars;
        for (let i = 0; i < escapeChars.length - 1; i++) {
          chars.splice(htmlIndex + 1, 1);
        }
      }
    }

    textIndex++;

    if (textIndex < errorCharStart || textIndex >= errorCharStart + errorLength) {
      continue;
    }

    chars[htmlIndex] = `<span class="dev-server-diagnostic-error-chr">${chars[htmlIndex]}</span>`;
  }

  return chars.join('');
}

function prepareLines(orgLines: d.PrintLine[], code: 'text'|'html') {
  const lines: d.PrintLine[] = JSON.parse(JSON.stringify(orgLines));

  for (let i = 0; i < 100; i++) {
    if (!eachLineHasLeadingWhitespace(lines, code)) {
      return lines;
    }
    for (let i = 0; i < lines.length; i++) {
      (<any>lines[i])[code] = (<any>lines[i])[code].substr(1);
      lines[i].errorCharStart--;
      if (!(<any>lines[i])[code].length) {
        return lines;
      }
    }
  }

  return lines;
}


function eachLineHasLeadingWhitespace(lines: d.PrintLine[], code: 'text'|'html') {
  if (!lines.length) {
    return false;
  }
  for (var i = 0; i < lines.length; i++) {
    if ( !(<any>lines[i])[code] || (<any>lines[i])[code].length < 1) {
      return false;
    }
    const firstChar = (<any>lines[i])[code].charAt(0);
    if (firstChar !== ' ' && firstChar !== '\t') {
      return false;
    }
  }
  return true;
}

const DEV_SERVER_MODAL = `dev-server-modal`;
