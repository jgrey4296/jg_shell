var Shell = require('../src/shell');

exports.tests = {

    initTest : function(test){
        var s = new Shell()
        test.ok(s !== undefined);

    }



};
