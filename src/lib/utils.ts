import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fixOklch(clonedDoc: Document) {
  // Helper to convert oklch to rgb
  const convertOklchToRgb = (match: string) => {
    try {
      const temp = document.createElement('div');
      temp.style.color = match;
      document.body.appendChild(temp);
      const rgb = window.getComputedStyle(temp).color;
      document.body.removeChild(temp);
      // If the browser doesn't support oklch, it might return the original string or a default color.
      // We want to ensure we return something html2canvas can parse.
      if (rgb.includes('oklch')) {
        // Fallback to a safe color if conversion failed
        return 'rgb(0, 0, 0)';
      }
      return rgb;
    } catch (e) {
      return 'rgb(0, 0, 0)';
    }
  };

  // 1. Fix all style tags by replacing the text content
  const styleTags = Array.from(clonedDoc.getElementsByTagName('style'));
  styleTags.forEach(styleTag => {
    try {
      if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
        styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, convertOklchToRgb);
      }
    } catch (e) {
      console.warn('Failed to fix oklch in style tag', e);
    }
  });

  // 2. Fix all stylesheets directly if accessible
  try {
    Array.from(clonedDoc.styleSheets).forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules);
        rules.forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            const cssText = rule.style.cssText;
            if (cssText.includes('oklch')) {
              // We have to iterate over all properties because setting cssText can be unreliable
              for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                const value = rule.style.getPropertyValue(prop);
                if (value.includes('oklch')) {
                  rule.style.setProperty(prop, value.replace(/oklch\([^)]+\)/g, convertOklchToRgb), rule.style.getPropertyPriority(prop));
                }
              }
            }
          }
        });
      } catch (e) {
        // Likely a CORS issue with an external stylesheet
      }
    });
  } catch (e) {}

  // 3. Fix all elements (inline styles and computed styles)
  const allElements = Array.from(clonedDoc.querySelectorAll('*'));
  allElements.forEach(el => {
    if (el instanceof HTMLElement || el instanceof SVGElement) {
      // Fix inline style attribute
      const styleAttr = el.getAttribute('style');
      if (styleAttr && styleAttr.includes('oklch')) {
        el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/g, convertOklchToRgb));
      }
      
      // Fix specific attributes for SVGs
      if (el instanceof SVGElement) {
        ['fill', 'stroke', 'stop-color'].forEach(attr => {
          const val = el.getAttribute(attr);
          if (val && val.includes('oklch')) {
            el.setAttribute(attr, convertOklchToRgb(val));
          }
        });
      }

      // Force computed styles to inline styles if they contain oklch
      try {
        const computed = window.getComputedStyle(el);
        // Expanded list of properties that might contain colors
        const properties = [
          'color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke', 
          'stop-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 
          'border-left-color', 'column-rule-color', 'text-decoration-color', 
          'text-emphasis-color', 'box-shadow', 'text-shadow', 'background-image'
        ];
        
        properties.forEach(prop => {
          try {
            const value = (computed as any)[prop];
            if (value && value.includes('oklch')) {
              const fixedValue = value.replace(/oklch\([^)]+\)/g, convertOklchToRgb);
              el.style.setProperty(prop, fixedValue, 'important');
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
  });
}
