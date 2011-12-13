var modelobj;
Ext.ns('DbConnection');
var contactStore;

Ext.setup({
	tabletStartupScreen: 'tablet_startup.png',
	phoneStartupScreen: 'phone_startup.png',
	icon: 'icon.png',
	glossOnIcon: false,
	onReady: function() {
		
		var dbconnval =  {dbName : "contacts", dbDescription: "testdb"};
		
	    Ext.DbConnection = new Ext.Sqlite.Connection(dbconnval);
		
	//    Ext.DbConnection.dbConn.transaction(function(tx) {
	//		var sql = "CREATE TABLE contact_table(ID INTEGER PRIMARY KEY ASC, firstName TEXT,lastName TEXT,modifyDate TEXT)";
	//		tx.executeSql(sql, ([]), function(){}, function(){});
	//    });
		
		
		var calculateDesiredWidth = function() {
			var viewWidth = Ext.Element.getViewportWidth(),
				desiredWidth = Math.min(viewWidth, 400) - 10;
			return desiredWidth;
		};

		var addPnl = new Ext.Panel({
			floating: true,
			centered: true,
			modal: true,
			width: calculateDesiredWidth(),
			dockedItems: [{
				dock: 'top',
				xtype: 'toolbar',
				title: 'Add User'
			},{
				dock: 'bottom',
				xtype: 'toolbar',
				items: [{
					text: 'Cancel',
					handler: function() {
						addPnl.hide();
					}
				},{
					xtype: 'spacer'
				},{
					text: 'Add',
					ui: 'action',
					handler: function() {
						var mainform 	= addPnl.getComponent(0);
						var formval 	= mainform.getValues();
						if(!Ext.isEmpty(formval.firstName) && !Ext.isEmpty(formval.lastName)){
							var dt 		= new Date();
							var dateval	= dt.format("Y-m-d H:i:s");
							formval.modifyDate = dateval;
							var rec = Ext.ModelMgr.create(formval, 'Contacts').save();
							contactStore.load();
							mainform.reset();
							addPnl.hide();
						} else {
							alert("Enter Values");
						}
						
					}
				}]
			}],
			items: [{
				xtype: 'form',
				items: [{
					xtype: 'fieldset',
					defaults:{
						labelWidth : '45%'
					},
					items: [{
						xtype : 'textfield',
						label : 'First Name',
						name  : 'firstName'
					},{
						xtype : 'textfield',
						label : 'Last Name',
						name  : 'lastName'
					}]
				}]
			}]
		});
		
		var editPnl = new Ext.Panel({
			floating: true,
			centered: true,
			modal: true,
			width: calculateDesiredWidth(),
			dockedItems: [{
				dock: 'top',
				xtype: 'toolbar',
				title: 'Edit User'
			},{
				dock: 'bottom',
				xtype: 'toolbar',
				items: [{
					text: 'Cancel',
					handler: function() {
						editPnl.hide();
					}
				},{
					xtype: 'spacer'
				},{
					text: 'Update',
					ui: 'action',
					handler: function() {
						var mainform 	 = editPnl.getComponent(0);
						var formval 	 = mainform.getValues();
						
						if(!Ext.isEmpty(formval.firstName) && !Ext.isEmpty(formval.lastName)){
							var dt 		= new Date();
							var dateval	= dt.format("Y-m-d H:i:s");
							formval.modifyDate = dateval;
							
							var rec = Ext.ModelMgr.create(formval, 'Contacts', formval.ID).save();
							
							contactStore.load();
							mainform.reset();
							editPnl.hide();
						} else {
							alert("Enter Values");
						}
						
					}
				}]
			}],
			items: [{
				xtype: 'form',
				items: [{
					xtype: 'fieldset',
					defaults:{
						labelWidth : '45%'
					},
					items: [{
						xtype : 'textfield',
						label : 'First Name',
						name  : 'firstName'
					},{
						xtype : 'hiddenfield',
						name  : 'ID'
					},{
						xtype : 'textfield',
						label : 'Last Name',
						name  : 'lastName'
					},{
						xtype : 'textfield',
						disabled :true,
						label : 'Last Modified',
						name  : 'modifyDateParsed'
					}]
				}]
			}]
		});
		
		modelobj = Ext.regModel('Contacts', {
            fields: [{			
					name : 'firstName',
					type : 'string'
				},{
					name :'lastName',
					type : 'string'
				},{
					name : 'ID',
					type : 'int',
					fieldOption : 'PRIMARY KEY ASC'
				},{
					name : 'modifyDate',
					type : 'string'
					
				},{
					name : 'modifyDateParsed',
					type : 'string',
					mapping : 'modifyDate', // not working
					isTableField : false, //newly implemented to distinguish field
					convert : function(value,rec){
						var dt = Date.parseDate(rec.get('modifyDate'), "Y-m-d H:i:s")
						newval = dt.format('M j, Y, g:i a');
						return newval;
					}
				}],
            proxy: {
                type: 'sqlitestorage',
				dbConfig :{
					tablename 	: 'contacts_tables',
					dbConn 	: Ext.DbConnection.dbConn,
					//dbQuery : 'SELECT * FROM contact_table limit 0,1' //dbQuery only works with read operation
				},
				reader : {
					idProperty : 'ID'
				}
			},
            writer: {
                type: 'json'
            }
        });
        
        contactStore = new Ext.data.Store({
            autoLoad:true,
            model : 'Contacts'
        });
		
		
		var mainPanel = new Ext.Panel({
			fullscreen: true,
			layout: {
				type: 'fit'
			},
			dockedItems: [{
				xtype: 'toolbar',
				title: 'SQlite DB',
				items: [{
					text: 'Clear DB',
					ui: 'decline',
					handler: function() {
						var p = contactStore.getProxy();
						p.truncate('contact_table');
						contactStore.load();
					}
				}, {
					xtype: 'spacer'
				}, {
					text: 'Add User',
					ui: 'action',
					handler: function() {
						addPnl.show();
					}
				}]
			},{
				xtype : 'toolbar',
				dock : 'top',
				items : [{
					xtype : 'spacer'
				},{
					xtype      : 'textfield',
					align : 'center',
					itemId :'searchfield',
					placeHolder: 'Search Firstname',
					listeners :{
						keyup: function(field) {
							var value = field.getValue();
							console.log(value);
							
							contactStore.load({params :{ name: value},query : 'select * from contacts_tables WHERE firstName = ?'});
						}
					}
				},{
					text : 'Reset',
					ui  : 'action',
					handler : function(){
						mainPanel.query("#searchfield")[0].setValue('');
						contactStore.load();
					}
				},{
					xtype : 'spacer'
				}]
			}],
			items: [{
				xtype: 'list',
				scroll: 'vertical',
				store: contactStore,
				onItemDisclosure: true,
				emptyText: '<div style="text-align:center;">No Records</div>',
				itemTpl: ['<div >{firstName} {lastName} </div>',
						'<div>{modifyDateParsed}</div>',
						'<div class="delete" style="position: absolute;float: right;text-align: right;top: 0.5em;right: 3em;"></div>'],
				onItemDisclosure: function(rec) {
					var contactmodel = Ext.ModelMgr.create(rec.data,'Contacts');
					editPnl.getComponent(0).loadModel(contactmodel);
					editPnl.show();
				},
				listeners:{
					itemtap :function(view, index, item, e ){
						if(e.getTarget(".delete")){
							var rec = view.store.getAt(index);
							var user = Ext.ModelMgr.create(rec.data, 'Contacts');
							user.destroy();
							view.store.remove(rec);
						}
					}
				}
			}]
		});
	}
});