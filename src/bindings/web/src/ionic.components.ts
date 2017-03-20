import { ComponentMeta, ProxyComponent } from '../../../utils/interfaces';
import { Config } from '../../../utils/config';
import { PlatformClient } from '../../../platform/platform-client';
import { ProxyElement } from '../../../element/proxy-element';

// declared in the base iife arguments
declare const components: ComponentMeta[];


const config = new Config();

const plt = new PlatformClient(window, document);

components.forEach(cmpMeta => {
  plt.registerComponent(cmpMeta);

  window.customElements.define(cmpMeta.tag, class extends ProxyElement implements ProxyComponent {
    constructor() {
      super(plt, config, cmpMeta.tag);
    }

    static get observedAttributes() {
      return cmpMeta.obsAttrs;
    }
  });
});
