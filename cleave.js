var Cleave = require('cleave.js');
var cleavePhone = new Cleave('#phone', {
    blocks: [3, 3, 4],
    delimiter: '-',
    delimiterLazyShow: true,
    numericOnly: true,
});
var cleaveCardnumber = new Cleave('#ccnumber', {
    creditCard: true
});
