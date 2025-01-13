/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search, runtime) => {


        const getInputData = (inputContext) => {
            var intLCId = runtime.getCurrentScript().getParameter({name: 'custscript_lc_id'});
            let arrLOLineData = [];
            try {
                let objSearch = search.create({
                    type: 'salesorder',
                    filters:  [
                        ['type', 'anyof', 'SalesOrd'],
                        'AND',
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['cogs', 'is', 'F'],
                        'AND',
                        ['taxline', 'is', 'F'],
                        'AND',
                        ['shipping', 'is', 'F'],
                        'AND',
                        ['applyinglinktype', 'anyof', 'DropShip'],
                        'AND',
                        ['applyingtransaction.internalid', 'anyof', intLCId],
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'tranid' }),
                        search.createColumn({ name: 'custcol_customer_po_num_linelevel' }),
                        search.createColumn({ name: 'line' }),
                        search.createColumn({ name: 'lineuniquekey' }),
                        search.createColumn({ name: 'line', join: 'applyingtransaction' }),
                        search.createColumn({ name: 'linesequencenumber', join: 'applyingtransaction' }),
                        search.createColumn({ name: 'lineuniquekey', join: 'applyingtransaction' }),
                        search.createColumn({ name: 'internalid', join: 'applyingtransaction' }),
                    ]
                });
                
                var searchResultCount = objSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrLOLineData.push({
                                    internalid: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                    tranid: pageData[pageResultIndex].getValue({name: 'tranid'}),
                                    customer_po: pageData[pageResultIndex].getValue({name: 'custcol_customer_po_num_linelevel'}),
                                    linesequencenumber: pageData[pageResultIndex].getValue({ name: 'linesequencenumber', join: 'applyingtransaction' }),
                                    lineuniquekey: pageData[pageResultIndex].getValue({ name: 'lineuniquekey' }),
                                    lc_internalid: pageData[pageResultIndex].getValue({ name: 'internalid', join: 'applyingtransaction' }),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchLineUniqueKeys', err.message);
            }
            log.debug("searchLineUniqueKeys arrLOLineData", arrLOLineData)
            return arrLOLineData;
        }

        const map = (mapContext) => {
            log.debug('map : mapContext', mapContext);
            let objMapValue = JSON.parse(mapContext.value)
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
