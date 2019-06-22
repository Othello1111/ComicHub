import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import logger from './logger';
import makeDir from './makeDir';
import config, { pdfSupportImage } from '../shared';
import axios from './axios';
import { getComicSite } from './parseUrl';
import convertImage from './convertImage';

export function getExtName(url: string): string {
    const extName = path.extname(url);
    const result = extName.match(/^\.\w+/gi);
    return _.head(result) || '';
}

function downloadImage(
    url: string,
    fileName: string,
    referer: string = 'https://www.manhuagui.com',
) {
    const extName = getExtName(url);
    if (!extName) {
        return;
    }
    const filePath = path.join(
        config.downloadBase,
        getComicSite(referer),
        fileName + extName,
    );
    const parseDir = path.parse(filePath);
    makeDir(parseDir.dir);
    const stream = fs.createWriteStream(filePath);

    stream.on('finish', async () => {
        logger.info(`[Download Image Success] ${filePath}`);
        if (pdfSupportImage.includes(parseDir.ext)) {
            return;
        }
        const result: boolean = await convertImage(filePath);
        if (!result) {
            await convertImage(filePath);
        }
    });

    // 转义链接中的中文参数
    const realUrl = encodeURI(url);
    axios({
        url: realUrl,
        responseType: 'stream',
        headers: {
            Referer: referer,
            'User-Agent': config.userAgent,
        },
    }).then((response) => {
        response.data.pipe(stream);
    });
}

export default downloadImage;
