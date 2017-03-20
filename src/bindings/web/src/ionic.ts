(function(d: HTMLDocument) {
  'use strict';

  function staticDir(): string {
    var val: any = d.querySelector('script[data-static-dir]');
    if (val) {
      return val.dataset['staticDir'];
    }

    val = d.getElementsByTagName('script');
    val = val[val.length - 1];

    var paths = val.src.split('/');
    paths.pop();

    return val.dataset['staticDir'] = paths.join('/') + '/';
  }

  function es5() {
    try {
      eval('(class C{})');
    } catch (e) {
      return true;
    }
  }

  const i: string[] = [
    'components'
  ];

  if (!window.customElements || es5()) {
    i.push('es5');
  }

  const s = d.createElement('script');
  s.src = `${staticDir()}ionic.${i.join('.')}.js`;
  d.head.appendChild(s);

})(document);
