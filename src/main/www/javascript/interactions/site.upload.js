function SiteUpload(){
    var siteCounts;
    var sites;
}

SiteUpload.prototype.uploadMultiple = function(sitesToUpload, progressCallback, successCallback, errorCallback){
    siteCounts = sitesToUpload.length;
    sites = sitesToUpload;
    devtrac.siteUpload._uploadInternal(sitesToUpload.slice(), progressCallback, successCallback, errorCallback);
}

SiteUpload.prototype.upload = function(site, successCallback, errorCallback){
    if (site.uploaded) {
        navigator.log.log('Site "' + site.name + '" is skipped as it is unchanged.');
        successCallback('Site "' + site.name + '" is skipped as it is unchanged.');
        return;
    }

    var siteData;
    try {
        siteData = devtrac.siteUpload._packageSite(site);
    } catch(ex) {
        alert('Error occurs while packeting site');
        navigator.log.log('Error: ' + ex);
        errorCallback(ex);
        return;
    }

    var bbSyncNode = devtrac.siteUpload._createBBSyncNode(siteData);

    devtrac.dataPush._callService(bbSyncNode, function(response){
        navigator.log.debug('Received response from service: ' + JSON.stringify(response));
        if (response['#error']) {
            var error = 'Error occured in uploading site "' + site.name + '". Please try again.';
            navigator.log.log(error);
            errorCallback(error);
        }
        else {
            site.uploaded = true;
            devtrac.currentSite = site;
            devtrac.dataStore.saveCurrentSite(function(){
                navigator.log.log('Site "' + site.name + '" is marked as uploaded.');
            });
            navigator.log.log('Site "' + site.name + '" uploaded successfully.');
            successCallback('Site "' + site.name + '" uploaded successfully.');
        }
    }, function(srvErr){
        navigator.log.log('Error in uploading site "' + site.name + '".');
        navigator.log.log(srvErr);
        errorCallback(srvErr);
    });
}

SiteUpload.prototype._uploadInternal = function(sitesToUpload, progressCallback, successCallback, errorCallback){
    if (sitesToUpload.length > 0) {
        var index = siteCounts - sitesToUpload.length;
        progressCallback('Site ' + (index + 1) + ' of ' + siteCounts + ' is uploading...');
        devtrac.siteUpload.upload(sitesToUpload.shift(), function(msg) {
            progressCallback(msg);
            devtrac.siteUpload._uploadInternal(sitesToUpload, progressCallback, successCallback, errorCallback);
        }, function(err) {
            progressCallback(err);
            devtrac.siteUpload._uploadInternal(sitesToUpload, progressCallback, successCallback, errorCallback);
        });
    } else {
        devtrac.siteUpload._processResult(successCallback, errorCallback);
    }
}

SiteUpload.prototype._packageSite = function(site){
    var siteData = [];

    siteData.push(devtrac.dataPush.createUpdatePlaceNode(site));

    if (site.offline) {
        navigator.log.debug('Collecting data for Creating new site ' + ((site && site.name) ? site.name : ''));
        site.id = "%REPORTITEMID%";
        site.placeId = "%PLACEID%";
        siteData.push(devtrac.dataPush.createFieldTripItemNode(devtrac.fieldTrip.id, site));
    }
    else {
        navigator.log.debug('Collecting data for Updating site ' + ((site && site.name) ? site.name : ''));
        siteData.push(devtrac.dataPush.updateFieldTripItemNode(site));
    }

    $.each(site.actionItems, function(ind, actionItem){
        navigator.log.debug('Collecting data for creating ActionItem ' + ((actionItem && actionItem.title) ? actionItem.title : '') + ' node');
        siteData.push(devtrac.dataPush.createActionItemNode(site.id, site.placeId, actionItem));
    });

    navigator.log.debug('Collecting data for Updating answers data');
    if (site.submission && site.submission.length && site.submission.length > 0) {
        var questionsNode = devtrac.dataPush.questionsSaveNode(site);
        if (questionsNode) {
            siteData.push(questionsNode);
        }
    }

    return siteData;
}

SiteUpload.prototype._createBBSyncNode = function(siteData){
    navigator.log.debug('Creating service sync node');
    var serviceSyncNode = devtrac.dataPush.serviceSyncSaveNode(siteData);
    var length = devtrac.common.convertHash(serviceSyncNode).length;
    navigator.log.debug('Calling upload service with ' + length + ' byte data.');
    return serviceSyncNode;
}

SiteUpload.prototype._processResult = function(successCallback, errorCallback){
    var failedCounts = 0;
    for(index in sites){
        failedCounts += (sites[index].uploaded ? 0 : 1);
    }

    var msg = 'Uploading finished. ' + failedCounts + ' failure in ' + siteCounts + (siteCounts > 1 ? ' sites' : ' site') + '.';

    failedCounts > 0 ? errorCallback(msg) : successCallback(msg);
}

