import * as Koa from 'koa';
import _ from 'lodash';
import mysqlService from '../service';
import { apiType } from '../shared';
import { IChapterMysql, IRequestData, ISearchMysql } from '../type';
import statusCodes from './config';
import generateBook from '../utils/generateBook';

function handleEmpty(stateType: string) {
    let dataResult: any;
    if (stateType === apiType.search) {
        dataResult = {
            message: '搜索不到该漫画，请更换搜索词！',
        };
    } else if (stateType === apiType.chapter) {
        dataResult = {
            message: '爬取结果为空！',
        };
    }
    return dataResult;
}

function filterArray(data: any = []) {
    const record: any = {};
    const result: any = [];
    data.forEach((item: any) => {
        if (!record[item.url]) {
            record[item.url] = 1;
            result.push(item);
        }
    });
    return result;
}

/* eslint-disable */
const mysqlHandler = async (ctx: Koa.Context, next: () => Promise<any>) => {
    const requestData: IRequestData = ctx.request.body;
    const {type: requestType, name: requestName} = requestData;
    ctx.state.url = requestName;
    ctx.state.type = requestType;
    if (!requestData.noCache) {
        if (requestType === apiType.search) {
            const result: any = await mysqlService.foggySearch(
                `%${requestName}%`,
                requestType,
            );
            if (!_.isEmpty(result)) {
                ctx.body = result;
                ctx.response.set({
                    'Mysql-Search-Table-Cache': 'true',
                });
                return;
            }
        }
        if (requestType === apiType.chapter) {
            const searchItem: ISearchMysql = await mysqlService.searchOne(
                requestName,
                apiType.search,
            );
            const results: any = await mysqlService.searchItem(
                _.get(searchItem, 'id', ''),
                requestType,
                'search_id',
            );
            if (!_.isEmpty(results)) {
                ctx.body = results;
                ctx.response.set({
                    'Mysql-Chapter-Table-Cache': 'true',
                });
                return;
            }
        }
        if (requestType === apiType.download) {
            const chapterItem: IChapterMysql = await mysqlService.searchOne(
                requestName,
                apiType.chapter,
            );
            const results: any = await mysqlService.searchItem(
                _.get(chapterItem, 'id', ''),
                requestType,
                'chapter_id',
            );
            if (!_.isEmpty(results)) {
                const searchItem: ISearchMysql = await mysqlService.searchOne(
                    _.get(chapterItem, 'search_id', ''),
                    apiType.search,
                    'id',
                );
                const bookPath: string = await generateBook(
                    results,
                    searchItem,
                    chapterItem,
                    requestName,
                );

                ctx.response.set({
                    'Mysql-Table-Download-Cache': 'true',
                });
                ctx.body = {
                    message: '下载成功！',
                    code: statusCodes.OK,
                    data: bookPath,
                };
                return;
            }
        }
    }

    await next();
    let dataResult = ctx.state.data;
    const stateType = ctx.state.type;
    if (!stateType) {
        if (dataResult) {
            ctx.body = dataResult;
        }
        return;
    }
    if (dataResult) {
        const searchUrl = ctx.state.url;
        if (stateType === apiType.search) {
            for (const item of dataResult) {
                await mysqlService.addItem(item, stateType);
            }
        }
        if (stateType === apiType.chapter) {
            dataResult = filterArray(dataResult);
            const searchResult: ISearchMysql = await mysqlService.searchOne(
                searchUrl,
                apiType.search,
            );
            for (const item of dataResult) {
                await mysqlService.addItem(
                    {
                        search_id: _.get(searchResult, 'id'),
                        ...item,
                    },
                    stateType,
                );
            }
        }
        if (stateType === apiType.download) {
            dataResult = filterArray(dataResult);
            const chapterItem: IChapterMysql = await mysqlService.searchOne(
                searchUrl,
                apiType.chapter,
            );
            const searchItem: ISearchMysql = await mysqlService.searchOne(
                _.get(chapterItem, 'search_id', ''),
                apiType.search,
                'id',
            );
            if (!_.isEmpty(searchItem) && !_.isEmpty(chapterItem)) {
                for (const item of dataResult) {
                    await mysqlService.addItem(
                        {
                            chapter_id: chapterItem.id,
                            ...item,
                        },
                        stateType,
                    );
                }
                const bookPath: string = await generateBook(
                    dataResult,
                    searchItem,
                    chapterItem,
                    searchUrl,
                );
                dataResult = {
                    message: '下载成功！',
                    code: statusCodes.OK,
                    data: bookPath,
                };
            }

        }
    } else {
        dataResult = handleEmpty(stateType);
    }

    ctx.body = dataResult;
};
export default mysqlHandler;
