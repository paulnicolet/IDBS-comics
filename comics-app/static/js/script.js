$(document).ready(function () {
    initTabs();
});

// Global cache
var cache = {
    forms: {},
    tables: {}
};


function initTabs() {
    // Search is active by default, so load it first
    buildSearch();

    // Init search tab
    $('#search-tab').on('click', function () {
        cacheTab();
        buildSearch();
    });

    $('#queries-tab').on('click', function () {
        cacheTab();
        buildQueries();
    });
}

function cacheTab() {
    // Get active tab
    var active;
    $('#tabs').children().each((idx, tab) => {
        if (tab.className == 'uk-active') {
            active = tab.id;
        }
    });

    cache.forms[active] = $('#db-interface').html();
    cache.tables[active] = $('#data-table').html();

    if (active == 'queries-tab') {
        cache.selected_query = $('#query-selector').find(":selected").text();
    }
}

function buildSearch() {
    // Restore cached data
    $('#data-table').html(cache.tables['search-tab'] || '');

    if (cache.forms['search-tab']) {
        // Restore cached form
        $('#db-interface').html(cache.forms['search-tab']);

        // Register the form
        $('#search-form').ajaxForm(function (data) {
            displayData(data);
        });
    } else {
        // Not in cache
        // Load the form
        $('#db-interface').load('/search', function () {
            // Register the form
            $('#search-form').ajaxForm(function (data) {
                displayData(data);
            });

            // Load the tables names and fill the advanced options
            $.ajax('/get_table_names').done(function (data) {
                data.forEach(function (name) {
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
}

function buildQueries() {
    // Restore cached data
    $('#data-table').html(cache.tables['queries-tab'] || '');

    if (cache.forms['queries-tab']) {
        // Restore cached form
        $('#db-interface').html(cache.forms['queries-tab']);
        var selector = ':contains("' + cache.selected_query + '")';
        $('#query-selector').children(selector).prop('selected', true);
        $('#queries-form').ajaxForm(function (data) {
            displayData(data);
        });
    } else {
        // Not in cache
        $('#db-interface').load('/queries', function () {
            $('#queries-form').ajaxForm(function (data) {
                displayData(data);
            });
        });
    }
}

function displayData(data) {
    var table = $('#data-table');

    // Build header
    var head = $("<thead></thead>");
    var firstRow = $("<tr></tr>");
    data.shift().forEach(function (name) {
        var cell = $('<th></th>');
        cell.append(name.replace(/_/g, ' '));
        firstRow.append(cell);
    });

    head.append(firstRow);
    table.html(head);

    // Build actual table
    var body = $("<tbody></tbody>");
    data.forEach(function (tuple) {
        // For each tuple, build the row
        var row = $("<tr></tr>");

        tuple.forEach(function (name) {
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
