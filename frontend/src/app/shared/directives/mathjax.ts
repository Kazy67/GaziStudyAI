import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

// Declare MathJax so TypeScript doesn't throw errors
declare var MathJax: any;

@Directive({
  selector: '[appMathjax]',
  standalone: true,
})
export class MathjaxDirective implements OnChanges {
  @Input('appMathjax') mathText: string = '';

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mathText']) {
      // 1. Insert the raw text (which contains the $$ LaTeX $$)
      this.el.nativeElement.innerHTML = this.mathText;

      // 2. Tell MathJax to scan this specific element and render the math
      if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise([this.el.nativeElement]).catch((err: any) => {
          console.error('MathJax rendering error:', err);
        });
      } else {
        // If MathJax hasn't loaded yet, try again in 500ms
        setTimeout(() => {
          if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise([this.el.nativeElement]);
          }
        }, 500);
      }
    }
  }
}
