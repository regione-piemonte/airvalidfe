import { NgModule } from '@angular/core';
import { TrimTextPipe } from './trim-text/trim-text.pipe';
import { SeparatoreMigliaiaPipe } from './separatore-migliaia.pipe';
import { DecodeHtmlPipe } from './decode-html.pipe';



@NgModule({
  declarations: [TrimTextPipe, SeparatoreMigliaiaPipe, DecodeHtmlPipe],
  exports: [TrimTextPipe, SeparatoreMigliaiaPipe, DecodeHtmlPipe]
})
export class PipesModule { }
