Ext.override(Ext.data.Model, {
	destroy: function(options) {
		var me = this,
			action = 'destroy';
			options = options || {};
			Ext.apply(options, {
				records: [me],
				action: action
			});

		var operation = new Ext.data.Operation(options),
			successFn = options.success,
			failureFn = options.failure,
			callbackFn = options.callback,
			scope = options.scope;
		var callback = function(operation) {
			if (operation.wasSuccessful()) {
				if (typeof successFn == 'function') {
					successFn.call(scope, record, operation);
				}
			} else {
				if (typeof failureFn == 'function') {
					failureFn.call(scope, record, operation);
				}
			}

			if (typeof callbackFn == 'function') {
				callbackFn.call(scope, record, operation);
			}
		};
		me.getProxy()[action](operation, callback, me);
		return me;
	}
});
