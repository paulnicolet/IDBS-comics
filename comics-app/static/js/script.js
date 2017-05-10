$(document).ready(() => {
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
    $('#search-tab').on('click', () => {
        cacheTab();
        buildSearch();
    });

    $('#queries-tab').on('click', () => {
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

    // Cache data
    cache.forms[active] = $('#db-interface').html();
    cache.tables[active] = $('#data-section').html();

    if (active == 'queries-tab') {
        cache.selected_query = $('#query-selector').find(":selected").text();
    }
}

function buildSearch() {
    if (cache.forms['search-tab']) {
        // Restore cached data
        $('#data-section').html(cache.tables['search-tab'] || '');

        // Restore cached form
        $('#db-interface').html(cache.forms['search-tab']);

        // Register the form
        asyncForm($('#search-form'));

        // Replace options in the form after hiding it
        $('#search-advanced-options').on('hidden', () => {
            $('#search-form').append($('#search-advanced-options'));
        });
    } else {
        // Not in cache
        // Load the form
        $('#db-interface').load('/search', () => {
            // Register the form
            asyncForm($('#search-form'));

            // Load the tables names and fill the advanced options
            $.ajax('/get_table_names').done(data => {
                buildAdvancedOptions(data);
            });
        });
    }
}

function buildQueries() {
    if (cache.forms['queries-tab']) {
        // Restore cached data
        $('#data-section').html(cache.tables['queries-tab'] || '');

        // Restore cached form
        $('#db-interface').html(cache.forms['queries-tab']);
        var selector = ':contains("' + cache.selected_query + '")';
        $('#query-selector').children(selector).prop('selected', true);
        asyncForm($('#queries-form'));
    } else {
        // Not in cache
        $('#db-interface').load('/queries', () => {
            asyncForm($('#queries-form'));
        });
    }
}

function buildAdvancedOptions(data) {
    data.forEach(name => {
        // Create checkbox
        var input = $('<input class="uk-checkbox" type="checkbox" checked>');
        input.attr('name', name);

        // Add label
        var label = $('<label></label>');
        label.append(input);
        label.append(' ' + name);

        $('#tables-checkboxes').append(label);
    });

    // Replace options in the form after hiding it
    $('#search-advanced-options').on('hidden', () => {
        $('#search-form').append($('#search-advanced-options'));
    });
}

function displayData(tables) {
    // Clear existing tables
    $('#data-section .uk-table').remove();

    // Append tables only if there are tuples
    tables.forEach(table => { appendTable(table[0], table[1], table[2]) })
}

function appendTable(name, schema, data) {
    var table = $('<table class="uk-table uk-table-striped uk-table-small uk-table-hover"></table>');

    // Insert caption
    table.html($('<caption></caption>').html(name));

    // Build header
    var head = $("<thead></thead>");
    var firstRow = $("<tr></tr>");
    schema.forEach(name => {
        var cell = $('<th></th>');
        cell.append(name.replace(/_/g, ' '));
        firstRow.append(cell);
    });

    head.append(firstRow);
    table.append(head);

    // Build actual table
    var body = $("<tbody></tbody>");
    data.forEach(tuple => {
        // For each tuple, build the row
        var row = $("<tr></tr>");

        tuple.forEach(name => {
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

    // Insert table into data section
    $('#data-section').append(table);
}

/**
 * Add or remove the spinner element above data table depending 
 * if it is present or not.
 */
function spinner() {
    if ($('#spinner').length) {
        $('#spinner').remove();
    } else {
        $('#spinner-slot').append($('<div class="uk-padding" id="spinner" uk-spinner></div>'));
    }
}

/**
 * Register a form element to submit with AJAX.
 * @param {jQuery} elem - Form element
 */
function asyncForm(elem) {
    elem.ajaxForm({
        beforeSend: spinner,

        success: data => {
            spinner();
            displayData(data);
        }
    });
}