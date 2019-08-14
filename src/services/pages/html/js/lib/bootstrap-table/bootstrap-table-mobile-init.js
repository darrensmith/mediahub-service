$(document).ready(function() {
    var $table = $('#table');
    var data = [];

    for (var i = 1; i <= 40; i++) {
        data.push({
            "id": i,
            "name": "Service " + i,
            "options": "<a href=\"#\">Test</a>"
        });
    }

    $table.bootstrapTable({
        iconsPrefix: 'font-icon',
        icons: {
            columns: 'font-icon-list-rotate'
        },
        paginationPreText: '<i class="font-icon font-icon-arrow-left"></i>',
        paginationNextText: '<i class="font-icon font-icon-arrow-right"></i>',
        data: data
    });
});
