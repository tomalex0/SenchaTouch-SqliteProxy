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


/**
 * newly implemented to get reference of field values
 * model.datafields =    fields; 
 */
Ext.apply(Ext.ModelMgr,{
	registerType: function(name, config) {
        /*
         * This function does a lot. In order, it normalizes the configured associations (see the belongsTo/hasMany if blocks)
         * then looks to see if we are extending another model, in which case it copies all of the fields, validations and 
         * associations from the superclass model. Once we have collected all of these configurations, the actual creation
         * is delegated to createFields and createAssociations. Finally we just link up a few convenience functions on the new model.
         */
        
        var PluginMgr    = Ext.PluginMgr,
            plugins      = PluginMgr.findByType('model', true),
            fields       = config.fields || [],
            associations = config.associations || [],
            belongsTo    = config.belongsTo,
            hasMany      = config.hasMany,
            extendName   = config.extend,
            modelPlugins = config.plugins || [],
            association, model, length, i,
            extendModel, extendModelProto, extendValidations, proxy;
        
        //associations can be specified in the more convenient format (e.g. not inside an 'associations' array).
        //we support that here
        if (belongsTo) {
            if (!Ext.isArray(belongsTo)) {
                belongsTo = [belongsTo];
            }
            
            for (i = 0; i < belongsTo.length; i++) {
                association = belongsTo[i];
                
                if (!Ext.isObject(association)) {
                    association = {model: association};
                }
                Ext.apply(association, {type: 'belongsTo'});
                
                associations.push(association);
            }
            
            delete config.belongsTo;
        }
        
        if (hasMany) {
            if (!Ext.isArray(hasMany)) {
                hasMany = [hasMany];
            }
            
            for (i = 0; i < hasMany.length; i++) {
                association = hasMany[i];
                
                if (!Ext.isObject(association)) {
                    association = {model: association};
                }
                
                Ext.apply(association, {type: 'hasMany'});
                
                associations.push(association);
            }
            
            delete config.hasMany;
        }
        
        //if we're extending another model, inject its fields, associations and validations
        if (extendName) {
            extendModel       = this.types[extendName];
            extendModelProto  = extendModel.prototype;
            extendValidations = extendModelProto.validations;
            
            proxy              = extendModel.proxy;
            fields             = extendModelProto.fields.items.concat(fields);
            associations       = extendModelProto.associations.items.concat(associations);
            config.validations = extendValidations ? extendValidations.concat(config.validations) : config.validations;
        } else {
            extendModel = Ext.data.Model;
            proxy = config.proxy;
        }
        
        model = Ext.extend(extendModel, config);
        
        for (i = 0, length = modelPlugins.length; i < length; i++) {
            plugins.push(PluginMgr.create(modelPlugins[i]));
        }
        
        this.types[name] = model;
        
        Ext.override(model, {
            plugins     : plugins,
            fields      : this.createFields(fields),
            associations: this.createAssociations(associations, name)
        });
        
        model.modelName = name;
        Ext.data.Model.setProxy.call(model, proxy || this.defaultProxyType);
        model.getProxy = model.prototype.getProxy;
        
        //newly implemented to get reference of field values
        model.datafields =    fields;
        
        model.load = function() {
            Ext.data.Model.load.apply(this, arguments);
        };
        
        for (i = 0, length = plugins.length; i < length; i++) {
            plugins[i].bootstrap(model, config);
        }
        
        model.defined = true;
        this.onModelDefined(model);
        
        return model;
    }
});
