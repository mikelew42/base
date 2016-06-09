/* * * * * * * * * * *
 *  FUNCTION GROUP

Blah
 */

var FunctionGroup = function FunctionGroup(){
	this.assign.apply(this, arguments);
	this.initialize();
};

FunctionGroup.prototype = Object.create(Group.prototype);

FunctionGroup.prototype.assign({
	type: "function",
	afg: true,
	initialize: function(){
		this.name = this.def.name;
		this.defFile = this.def.trace.file;
		this.argNames = this.def.argNames;

		if (!this.def.expand)
			this.method = "groupCollapsed";

		this.autoFileGroup();

		this.resolveArgs();
		this.log();
		this.fileChangeLabel();
	},
	retLog: function(){
		if (!log.returnToGroup(this))
			console.warn("group inconsistency");

		if (is.def(this.returnValue)){
			log.currentGroup.close();
			console.log('%creturn', groupStyles + "margin-left: " + styles.indent, this.returnValue);
		} else {
			if (this.logUndefinedReturnValue)
				console.log('%creturn', groupStyles, this.returnValue);
			
			log.currentGroup.close();
		}
		return this.returnValue;
	},
	execute: function(){
		this.returnValue = this.def.fn.apply(this.ctx, this.arguments);
		this.retLog();
		return this.returnValue;
	},
	fileChangeLabel: function(){
		// if fn is defined elsewhere, label the file change
		if (log.currentFile !== this.def.file){
			console.log("%c"+ this.def.file, groupStyles + "font-weight: bold");
			log.currentFile = this.def.file;
		}
	},
	resolveArgs: function(){
		var line = this.trace.line;

		// build the function call label
		var label = [ "%c" + line, groupStyles, this.def.label + "(" ];

		if (this.argNames.length){
			for (var i = 0; i < this.argNames.length; i++){
				if (this.argNames[i])
					label.push(this.argNames[i]+":");
				label.push(this.arguments[i]);
				if (i < this.argNames.length - 1){
					label.push(",");
				}
			}
		}
		label.push(")");
		this.args = label;
	},
	close: function(){
		if (this.open){
			if (this === log.currentGroup){
				console.groupEnd();
				// console.log("closed fn group: ", this.name);
				this.open = false;
				
				if (this.def.cb)
					log.currentFile = this.def.file;
				else
					log.currentFile = this.trace.file;

				log.currentGroup = log.openGroups.pop();
			} else {
				console.warn("attempting to close incorrect group");
			}
		} else {
			console.warn("already closed, fn group: ", this.name);
		}
	}
});