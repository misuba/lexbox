module.exports = {
  applyTo: function(hbs) {

    // Usage: {{#key_value obj}} Key: {{key}} // Value: {{value}} {{/key_value}}
    //
    // Iterate over an object, setting 'key' and 'value' for each property in
    // the object.
    hbs.registerHelper("each_key_value", function(obj, fn) {
        var buffer = "",
            key;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                buffer += fn({key: key, value: obj[key]});
            }
        }

        return buffer;
    });


  }
}