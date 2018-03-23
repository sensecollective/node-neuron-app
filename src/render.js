// @flow

import path from 'path';
import fs from 'fs-extra';
import ejs from 'ejs';

/**
 * Renders template with ejs.
 *
 * @param {string} tplName Filename of template to render.
 * @param {Object} options Params to render template with.
 * @return {Promise<string>}
 */
export async function render(
  tplName: string,
  options: Object,
): Promise<string> {
  const fileName = path.resolve(
    path.dirname(module.parent.parent.filename),
    'views',
    `${tplName}.ejs`,
  );

  const tpl = await fs.readFile(fileName);

  return ejs.render(tpl.toString(), options);
}
