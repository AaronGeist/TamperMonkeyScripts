// ==UserScript==
// @name         ZhipinCaimiConnector
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       shakazxx
// @match        *://*.zhipin.com/*
// @grant        GM.xmlHttpRequest
// @connect      hire.alibaba-inc.com

// ==/UserScript==

var BaseHandler = {

    createNew: function() {
        // 内部实例
        var instance = {};

        // 常量
        var processedTag = 'processed';

        var topSchools = ["清华大学","北京大学","复旦大学","上海交通大学","中国科学技术大学","中国人民大学","北京航空航天大学",
                          "南京大学","同济大学","浙江大学","南开大学","北京师范大学","武汉大学","西安交通大学","华中科技大学",
                          "天津大学","中山大学","北京理工大学","东南大学","华东师范大学","哈尔滨工业大学","厦门大学","四川大学",
                          "西北工业大学","电子科技大学","华南理工大学","中南大学","大连理工大学","吉林大学","湖南大学","山东大学",
                          "重庆大学","中国农业大学","中国海洋大学","中央民族大学","东北大学","兰州大学","西北农林科技大学","国防科技大学"];

        var topCompanys = ["美团", "点评", "阿里", "淘宝", "携程", "谷歌", "亚马逊", "拼多多", "平安", "腾讯", "百度", "搜狗",
                           "京东", "驴妈妈", "网易", "华为", "亿贝", "盛大", "点融", "苏宁", "喜马拉雅", "去哪儿", "360", "饿了么",
                           "爱奇艺","哔哩哔哩", "陆金所", "途牛", "蘑菇街", "Google", "Amazon", "PayPal", "Ebay", "Netflix", "IBM",
                           "拉扎斯", "银联", "海康威视", "字节跳动", "58同城", "携程", "唯品会", "小红书", "美银宝", "思科", "科大讯飞"];


        instance.addAttribute = function(e, attr, value) {
            let attrValue = e.getAttribute(attr);
            if (!attrValue) {
                attrValue = '';
            } else {
                attrValue += ' ';
            }

            attrValue += value;
            e.setAttribute(attr, attrValue);
        };

        instance.loop = function(intervalTime, callback, stopIfFound) {
            let waitId = setInterval(function () {
                var items = document.querySelectorAll(instance.getItemCssSelector());
                if (!items) {
                    alert("cannot find talent items");
                } else {
                    //console.log('page loaded: ' + items.length);
                    if (stopIfFound) {
                        // 终止轮训
                        clearInterval(waitId);
                    }

                    // 回调函数
                    callback(items);
                }
            }, intervalTime);
        };

        instance.handle = function(items) {

            items.forEach(function(e) {
                // 页面会ajax加载新的，老的简历不需要再处理
                if (e.getAttribute('class').indexOf(this.processedTag) != -1) {
                    return;
                }

                try {
                    // 开始处理
                    instance.elaborate(e, instance.parseData(e));
                } catch(err) {
                    console.log(err);
                    console.log(e.innerHTML);
                }
            });

            console.log(items.length);
            if (items.length > 0) {
                let last = items[items.length - 1];

                // 如果没有滚动条，塞点东西进去，创造一个，否则无法触发ajax自动加载
                if (document.body.scrollHeight <= (window.innerHeight || document.documentElement.clientHeight)) {
                    console.log("fillingEmptyBox");
                    last.parentNode.insertBefore(instance.createEmptyBox(), last.nextSibling);
                }
            }
        };

        instance.createEmptyBox = function() {
            var box = document.createElement('div');
            instance.addAttribute(box, 'style', 'height: 1000px; background-color: lightyellow;');
            return box;
        };

        instance.elaborate = function(e, data) {
            let [nameStr, schoolStr, age, workYear, edu, workStr, genderStr] = data;

            let searchData = nameStr + ' ' + schoolStr + ' ' + age + ' ' + workYear + ' ' + edu + ' ' + workStr + ' ' + genderStr;
            console.log(searchData);

            if (edu == '大专' || age >= 33 || workYear >= 8 || workYear <= 2) {
                instance.hide(e);
            } else {
                // elaborate top school
                let eduBoxes = instance.getEduInfos(e);
                eduBoxes.forEach(function(item) {
                    for (var index in topSchools) {
                        let school = topSchools[index];
                        item.innerHTML = item.innerHTML.replace(new RegExp(school, 'i'), '<strong style="background-color: lightgreen">' + school + '</strong>');
                    }
                });

                // elaborate top company
                let workBoxes = instance.getWorkInfos(e);
                workBoxes.forEach(function(item) {
                    for (var index in topCompanys) {
                        let company = topCompanys[index];
                        item.innerHTML = item.innerHTML.replace(new RegExp(company, 'i'), '<strong style="background-color: lightgreen">' + topCompanys[index] + '</strong>');
                    }
                });

                // male/female
                if (genderStr == "F") {
                    instance.addAttribute(e, 'style', 'background-color:lightpink;');
                } else {
                    instance.addAttribute(e, 'style', 'background-color:navajowhite;');
                }
            }

            if (localStorage.getItem(searchData)) {
                if (instance.isShowViewed()) {
                    instance.markAsRead(e);
                } else {
                    instance.hide(e);
                }
            }

            // 增加查询采蜜按钮
            e.appendChild(instance.createLinkButton(e, nameStr, workStr, schoolStr));

            // 标记已经处理过
            instance.addAttribute(e, 'class', this.processedTag);

            // 点击后标记已读，并存入浏览器缓存
            e.addEventListener("click", function() {
                localStorage.setItem(searchData, true);
                instance.markAsRead(e);
            }, false);
        };

        instance.markAsRead = function(e) {
            instance.addAttribute(e, 'style', 'border:8px dashed red;');
        };

        instance.hide = function(e) {
            instance.addAttribute(e, 'style', 'display: none;');
        };

        instance.getURL_GM = function(url, data, headers, callback) {
            GM.xmlHttpRequest({
                method: 'POST',
                url: url,
                headers: headers,
                data: data,
                onload: function(response) {
                    if (response.status >= 200 && response.status < 400) {
                        callback(response.responseText);
                    } else {
                        console.log(
                            'Error getting ' + url + ' (' + this.status + ' ' + this.statusText +
                            '): ' + this.responseText);
                    }
                },
                onerror: function(response) {
                    console.log('Error during GM.xmlHttpRequest to ' + url + ': ' + response.statusText);
                }
            });
        };

        instance.getJSON_GM = function(url, data, headers, callback) {
            // 先从缓存取，没有在调用查询
            let cache = localStorage.getItem(data);
            if (cache != undefined) {
                console.log("existing: " + data);
                callback(JSON.parse(cache));
            } else {
                instance.getURL_GM(url, data, headers, function(response) {
                    localStorage.setItem(data, response);
                    callback(JSON.parse(response));
                });
            }
        }

        instance.getJSON = function(response) {
            if (response.status >= 200 && response.status < 400) {
                return response.json();
            }
            return Promise.reject(new Error(response.status + response.statusText));
        };

        instance.getCaimiData = function(name, company, school, callback) {
            let url = 'https://hire.alibaba-inc.com/caimiTalentSearch/search.json?_tb_token_=ui2tpac9nt&tid=1585893017538caimi_professional_search&pageId=caimi_professional_pc_search&appSource=caimi_professional_search';

            let raw_data = {
                "keyword": name,
                "pageSize": 10,
                "pageIndex": 1,
                "accurateQueryTag": 1,
                "batchReadQueryTag": "0"
            }

            if (company || school) {
                raw_data.accurateQueryTag = 0; // not accurate
                if (company) {
                    raw_data.compay = ["origin_" + company];
                }
                if (school) {
                    raw_data.graduateSchool = ["normalized_" + school];
                }
            }

            let data = encodeURI("param=" + JSON.stringify(raw_data));

            let headers = {
                ":authority": "hire.alibaba-inc.com",
                ":method": "POST",
                ":path": "/caimiTalentSearch/search.json?_tb_token_=ui2tpac9nt&tid=1585893017538caimi_professional_search&pageId=caimi_professional_pc_search&appSource=caimi_professional_search",
                "scheme": "https",
                "accept": "application/json, text/plain, */*",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6,ja;q=0.5",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "cookie": "cna=CzD3Fv0ClnQCAYzNk66d1N6i; tianshu_csrf_token=ef34530c-f6f3-444f-b040-ed791f0c4c9c; c_csrf=ef34530c-f6f3-444f-b040-ed791f0c4c9c; tianshu_corp_id=alibaba; hrc_sidebar=open; emplId=107253; UM_distinctid=170f24da8967f4-0a70281d9cdfc8-396c7406-13c680-170f24da897a88; JSESSIONID=CFYJBJ4V-5X5ECTMK44LIM6YP29PK3-SYC9QZ7K-P28; tmp0=iiLJGw52VfPIOY7ZTfKccpTYYJZBqVivyW8zaGdfne%2BDcqUInL%2BOsNq5gUGz%2FJFDHXmPQlUcCXzCk63JjrTGFMrAp41ZEHZL28yPWe4CFFqV86MQUxx1g3aaIuid8RTpU8hojI8VErSKs8CV2Ks33qhloFSotp5YcQugp8PLrFs%3D; SSO_EMPID_HASH_V2=be5279a11fc42d87d2b41cbb38970550; SSO_BU_HASH_V2=2c14ff4badb45e563bf7c832da4f1edc; SSO_LANG_V2=ZH-CN; EHRSSO_USER_COOKIE=8530DF0DCDD1CC4ADE1D0F2F67FD7D659958790E1AC21FD0127ED0EEEB58EE859E6CA80F19CF29AFBB80ABB37C539024F07F52528FD5EE9AF9CEEC0FACC467585F51ADD5B8D7ED6EA2A1FB5A6E8716069508ED6F1177F685EC3A0D3B0A5B0C46436E53A6996A48D46ED44F2A7002DF1C7CB43D96AC309BBA209D1AF4A2EC038691E5382278CBDB377D0C592FA4494252296145DC9B0DCB46FCBFDA5E2C3B0E709C078CC1D3CF9886F5334E515ED2CBCF7767E92CB5F36CB7C116523CD35032592BC11DB316F128DA71736CA489D581158786473049D47924FD0D5D7D99D64C1A5D54770706E5B3F011858C71E8E6F6D33EEB8BDA753C95B5CD591F02FDBEEDE6FECB6AA008596685CD10D3C98CFA55C87A9E684C04345C67E09195279C673B4C39C2CC25363FA17870A906C3F537218BEAB0D9B94A7BDBC8619D9456DF932FBBF2A9B7353FD6BCC7D3E8533F203C1B61ACB70285C2DE1C4A284DC0CD44AF5A57EBEE4E277F5D079F1462D7A08E0F08B1B1DE464C61D30524F032CC51728875F3A857B177C1ECF7F3093DFBB4F9FF15086F57F722B8150ACA1077EEFFC259DE41E487AB84BD251BE5F0E334223001B00191306D5283736810DDEFEB133746F72D7E2269659BDE54EE51FDDCC3A554947855AEE766671E8FB9A7DCBBDFCF7C89CDB4AA76D6EFE738C543565F96CB040A342C5AAC3896294CA6A5EF11AD58D81ABA6B653A339E1320D2D99E5D816CB905A9; tianshu_app_type=APP_ZXBCWQX7OG7ZKNWVTHD8; _tb_token_=8TAYXJBm0LOduyzZOhmE; EHRSSO_SSO_TOKEN_V2=534CA8CA48012A96ABAD877A4854DCF88B4DCB94F01451C4D198F4A7A06426402A0677564073DFD45A7C9EA126100D2FFA93C74516DD4FEC639069B631124A5F; isg=BAEBczVzO9bhhlcNDWpNzsX9EEsbLnUgAzyh2WNes4hnSj4cKnox8OkMLLYMwg1Y",
                "dnt": "1",
                "origin": "https://hire.alibaba-inc.com",
                "referer": "https://hire.alibaba-inc.com/caimiSearch/search.htm",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
            };

            instance.getJSON_GM(url, data, headers, callback);
        }

        instance.createBox = function(resp) {
            console.log(JSON.stringify(resp));
            var box = document.createElement('div');

            let cnt = resp.content.realTotalRecord;
            if (cnt == 0) {
                instance.addAttribute(box, 'style', 'padding: 3px 10px 3px 10px;background-color: lightgreen;');
                box.insertAdjacentHTML('beforeend', '<p>未查到采蜜数据</p>')
                return box;
            }
            let info = resp.content.talentInfo[0];

            let url = info.accessUrl;

            let applicationTimes = info.talentDetail.applicationStat.applicationTimes;
            let forecastLevel = info.talentDetail.applicationStat.forecastLevel;
            let forecastLevelTime = info.talentDetail.applicationStat.forecastLevelTime;
            let reviewHistory = "简历投递 " + applicationTimes + " 次";
            if (forecastLevel != undefined) {
                reviewHistory += "，最高层级 " + forecastLevel + "(" + forecastLevelTime + ")"
            }

            let appliable = true;
            if (info.operation != undefined) {
                appliable = info.operation.application;
            }

            if (!appliable) {
                reviewHistory += '｜ <strong style="background-color:lightsalmon">在应聘流程中</strong>';
            } else {
                reviewHistory += ' | <strong style="background-color:lightgreen">未在应聘流程中</strong>';
            }

            let school = info.talentDetail.school;
            let name = info.talentDetail.name;
            let degree = info.talentDetail.degree;

            let workHistory = '';
            if (info.talentDetail.recentWorkInfo.length > 0) {
                info.talentDetail.recentWorkInfo.forEach(function(workInfo) {
                    let company = workInfo.company;
                    let position = workInfo.position;
                    let time = workInfo.workTime;

                    workHistory += '<span style="margin-right:20px;">' + company + '-' + position + '(' + time + ')</span>';
                });
            }


            //console.log(reviewHistory);
            //console.log(workHistory);

            let positiveTags = '';
            let negativeTags = '';
            if (info.evalTags.length > 0) {
                info.evalTags.forEach(function(evalTag) {
                    let agreeTimes = evalTag.agreeTimes;
                    let name = evalTag.name;
                    let categoryCodes = evalTag.categoryCodes;

                    if (categoryCodes.indexOf("positive") != -1) {
                        positiveTags += '<span style="margin-right: 10px;">' + name + "(" + agreeTimes + ")</span>";
                    } else {
                        negativeTags += '<span style="margin-right: 10px;>' + name + "(" + agreeTimes + ")</span>";
                    }
                });
            }

            instance.addAttribute(box, 'style', 'padding: 3px 10px 3px 10px;background-color: lightyellow;');
            box.insertAdjacentHTML('beforeend',
                                   '<p><a href="' + url + '" target="blank">'+ name + ' | ' + school + ' | ' + degree + '</a></p>' +
                                   '<p>' + reviewHistory + '</p>' +
                                   '<p>' + workHistory + '</p>' +
                                   '<p style="color: green;">' + positiveTags + '</p>' +
                                   '<p style="color: red;">' + negativeTags + '</p>'
                                  );

            return box;
        }

        instance.createLinkButton = function(e, nameStr, workStr, schoolStr) {
            var box = document.createElement('div');

            box.addEventListener("click", function() {
                instance.getCaimiData(nameStr, workStr, schoolStr, function(resp) {
                    e.appendChild(instance.createBox(resp));
                });
            }, false);

            instance.addAttribute(box, 'style', 'padding: 3px 10px 3px 10px;background-color: lightyellow;');
            box.insertAdjacentHTML('beforeend',
                                   '<p>连接采蜜</p>'
                                  );
            return box;
        }

        return instance;
    }
};

var ZhipinHandler = {

    createNew: function() {
        var handler = BaseHandler.createNew();

        handler.getItemCssSelector = function() {
            return 'div.geek-info-card';
        };

        handler.getEduInfos = function(e) {
            return e.querySelectorAll('.card-inner .col-3 .edu-exp-box');
        };

        handler.getWorkInfos = function(e) {
            return e.querySelectorAll('.card-inner .col-3 .work-exp-box');
        };

        handler.parseData = function(e) {
            var name = e.querySelector('.card-inner .col-2 .name');
            var nameStr = "";
            if (name != undefined) {
                nameStr = name.innerText.split('\n')[0];
            }

            var gender = e.querySelector('.iboss-icon_women');
            var genderStr = 'M';
            if (gender != undefined) {
                genderStr = 'F';
            }
            var school = e.querySelector('.card-inner .col-3 .edu-exp-box');
            var schoolStr = "";
            if (school) {
                schoolStr = school.innerText.split(' ')[1];
            }

            var info = e.querySelector('.card-inner .col-2 .info-labels');

            var age = info.innerText.split("  ")[0].split('岁')[0];
            var workYear = info.innerText.split("  ")[1].split('年')[0];
            var edu = info.innerText.split('  ')[2];

            var work = e.querySelector('.card-inner .col-3 .work-exp-box');
            var workStr = "";
            if (work != undefined) {
                workStr = work.innerText.split(' ')[1];
            }

            return [nameStr, schoolStr, age, workYear, edu, workStr, genderStr];
        };

        handler.isShowViewed = function() {
            return false;
        };

        return handler;
    }
};

(function() {
    'use strict';

    var host = location.hostname;
    if (host === 'www.zhipin.com') {
        var zp = ZhipinHandler.createNew();
        zp.loop(1000, zp.handle, false);
    }

})();
