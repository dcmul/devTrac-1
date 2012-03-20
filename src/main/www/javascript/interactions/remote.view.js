function RemoteView(){

}

RemoteView.prototype.call = function(viewName, displayId, viewArgs, successCallback, failedCallback){
	var sessionId = devtrac.user.session.id;
	var timestamp = Math.round(new Date().getTime() / 1000);
	var params = {
			method: DT.VIEWS_GET,
			sessid: sessionId,
			domain_name: DT.DOMAIN,
			domain_time_stamp: timestamp,
			api_key: DT.API_KEY,
			nonce: timestamp,
			hash: devtrac.common.generateHash(DT.VIEWS_GET, timestamp),
			view_name: viewName,
			display_id: displayId,
			args: viewArgs
	};
	
	devtrac.common.callService(params, successCallback, failedCallback);
}

RemoteView.prototype.callWithUrl = function(url, displayId, successCallback, failedCallback){
    var params = {
        display_id: displayId
    };
    devtrac.common.callServiceWithUrl(url, params, successCallback, failedCallback);
}

