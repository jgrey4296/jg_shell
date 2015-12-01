var ReteNet = require('../src/Rete/ReteInterface');

exports.ReteTests = {

    initTest : function(test){
        var reteNet = new ReteNet.ReteNet();
        test.ok(reteNet !== undefined);
        test.done();
    },
    
    addWMETest : function(test){
        var reteNet = new ReteNet.ReteNet();
        var id = ReteNet.addWME({a:5},reteNet);

        test.ok(reteNet.wmeLifeTimes.assertions[reteNet.currentTime].length === 1);
        test.ok(reteNet.allWMEs[id] !== undefined);
        test.done();
    },

    



};
