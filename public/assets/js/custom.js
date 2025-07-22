
function customJqueryValidation() {
	
			jQuery.validator.addMethod("ontimedate", function(value, element) {
			  return this.optional(element) || /^\d{2}\/\d{2}\/\d{4}$/.test( value );
			}, 'Please enter MM/DD/YYYY format date only.');

 }
