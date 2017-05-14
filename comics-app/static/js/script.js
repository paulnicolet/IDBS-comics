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

    $('#delete-tab').on('click', () => {
        // TODO shouldn't be able to delete from a relation ?
        cacheTab();
        buildDelete();
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

    // Cache form
    cache.forms[active] = $('#db-interface').clone();

    // Cache tables if present
    if ($('#data-section').find('table').length) {
        cache.tables[active] = $('#data-section').find('table').clone();
    }

    if (active == 'queries-tab') {
        cache.selected_query = $('#query-selector').find(":selected").text();
    }
}

function buildSearch() {
    // Restore form
    if (cache.forms['search-tab']) {
        $('#db-interface').html(cache.forms['search-tab']);
        restoreSearchFormEvents(displayData);
    } else {
        loadSearchForm(displayData);
    }

    // Restore data
    $('#data-section').find('table').remove();
    if (cache.tables['search-tab']) {
        $('#data-section').append(cache.tables['search-tab']);
    }
}

function buildQueries() {
    if (cache.forms['queries-tab']) {
        // Restore cached form
        $('#db-interface').html(cache.forms['queries-tab']);
        var selector = ':contains("' + cache.selected_query + '")';
        $('#query-selector').children(selector).prop('selected', true);
        asyncForm($('#queries-form'), displayData);
    } else {
        // Not in cache
        $('#db-interface').load('/queries', () => {
            asyncForm($('#queries-form'), displayData);
        });
    }

    // Restore data
    $('#data-section').find('table').remove();
    if (cache.tables['queries-tab']) {
        $('#data-section').append(cache.tables['queries-tab']);
    }
}

function buildDelete() {
    // Restore form
    if (cache.forms['delete-tab']) {
        $('#db-interface').html(cache.forms['delete-tab']);
        restoreSearchFormEvents(displayClickableData);
    } else {
        loadSearchForm(displayClickableData);
    }

    // Restore data
    $('#data-section').find('table').remove();
    if (cache.tables['delete-tab']) {
        $('#data-section').append(cache.tables['delete-tab']);
    }

    // Register delete events
    deleteOnClick();
}

function displayClickableData(data) {
    displayData(data);
    deleteOnClick();
}

function deleteOnClick() {
    // Select all rows
    $('tbody tr').on('click', event => {
        // Get the row and table name
        var row = $(event.currentTarget);
        var table = row.closest('table').find('caption').html();

        confirmMsg = 'Do you really want to delete tuple with ID ' + row.attr('id') + ' from the database ?';
        UIkit.modal.confirm(confirmMsg).then(() => {
            // Remove row 
            row.remove();

            // Request server to remove from DB
            $.ajax('/delete', {
                data: {
                    'id': row.attr('id'),
                    'table': table
                },
                method: 'POST',
                success: () => { console.log('Success') }
            })
        }, () => { });
    });
}

function restoreSearchFormEvents(callback) {
    // Register the form
    asyncForm($('#search-form'), callback);

    // Replace options in the form after hiding it
    $('#search-advanced-options').on('hidden', () => {
        $('#search-form').append($('#search-advanced-options'));
    });

    // Register select all button
    $('#checkall').on('change', selectAll);
}

function buildAdvancedOptions(data) {
    // Build select all option
    var checkall = $('<input class="uk-checkbox" id="checkall" type="checkbox" checked>');
    var label = $('<label></label>');
    label.append(checkall);
    label.append(' SELECT ALL');

    checkall.on('change', selectAll);

    $('#tables-checkboxes').append(label);

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

function loadSearchForm(callback) {
    $('#db-interface').load('/search', () => {
        // Register the form
        asyncForm($('#search-form'), callback);

        // Load the tables names and fill the advanced options
        $.ajax('/get_table_names').done(data => {
            buildAdvancedOptions(data);
        });
    });
}

function selectAll() {
    var boxes = $('#tables-checkboxes').find('.uk-checkbox');
    boxes.each((idx, box) => {
        if ($(box).attr('id') != 'checkall') {
            if ($('#checkall').prop('checked')) {
                $(box).prop('checked', true);
            } else {
                $(box).prop('checked', false);
            }
        }
    });
}

function displayData(tables) {
    // Clear existing tables
    $('#data-section').find('table').remove();

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

        tuple.forEach((value, idx) => {
            // For each element, build the cell
            var cell = $('<td></td>');
            cell.append(value);

            // Insert in the current row
            row.append(cell);

            // Set tuple ID as row ID
            if (idx == 0) {
                row.attr('id', value);
            }
        });

        // Insert the row in the body
        body.append(row);
    });

    // Insert body in the table
    table.append(body);

    // Insert table into data section
    $('#data-section').append(table);
}

function spinner() {
    if ($('#spinner').length) {
        $('#spinner').remove();
    } else {
        $('#spinner-slot').append($('<div class="uk-padding" id="spinner" uk-spinner></div>'));
    }
}

function asyncForm(elem, callback) {
    elem.ajaxForm({
        beforeSend: spinner,

        success: data => {
            spinner();
            callback(data);
        }
    });
}