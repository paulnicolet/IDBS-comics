$(document).ready(function () {
    initTabs();
});

function initTabs() {
    // Search is active by default, so load it first
    buildSearch();

    // Init search tab
    $('#search-tab').on('click', function() {
        buildSearch();
    });
}

function buildSearch() {
    // Load the form
    $('#db-interface').load('/search', function() {
        // Register the form
        $('#search-form').ajaxForm(function(data) {
            displayData(data);
        });

        // Load the tables names and fill the advanced options
        $.ajax('/get_table_names').done(function(data) {
            data.forEach(function(name) {
                name = ' ' + name + ' ';

                // Create checkbox
                var input = $('<input class="uk-checkbox" type="checkbox" checked>');
                input.attr('name', name);

                // Add label
                var label = $('<label></label>');
                label.append(input);
                label.append(name);

                $('#tables-checkboxes').append(label);
            });
        });
    });
}

function displayData(data) {
    var table = $('#data-table');

    // Build header
    var head = $("<thead></thead>");
    var firstRow = $("<tr></tr>");
    data.shift().forEach(function(name) {
        var cell = $('<th></th>');
        cell.append(name);
        firstRow.append(cell);
    });

    head.append(firstRow);
    table.append(head);

    // Build actual table
    var body = $("<tbody></tbody>");
    data.forEach(function(tuple) {
        // For each tuple, build the row
        var row = $("<tr></tr>");

        tuple.forEach(function(name) {
            // For each element, build the cell
            var cell = $('<td></td>');
            cell.append(name);

            // Insert in the current row
            row.append(cell);
        });

        // Insert the row in the body
        body.append(row);
    });

    // Insert body in the table
    table.append(body);
}
