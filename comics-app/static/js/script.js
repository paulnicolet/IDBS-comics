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

    $('#insert-tab').on('click', () => {
        cacheTab();
        buildInsert();
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

/* ------------------------------ Tab builders ------------------------------ */
function buildSearch() {
    // Restore form
    if (cache.forms['search-tab']) {
        $('#db-interface').html(cache.forms['search-tab']);
        restoreSearchFormEvents(displayData);
    } else {
        loadSearchForm(displayData, false);
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

function buildInsert() {
    // Remove data 
    $('#data-section').find('table').remove();

    // Load form
    $('#db-interface').load('/insert', () => {
        //create all the cells based on the selected table
        asyncForm($('#insert-form'), createInsertCells);
        //$('#insert-data-form').ajaxForm();
        asyncForm($('#insert-data-form'), () => {
            UIkit.notification('Data inserted!', 'success');
        });
        
        $('#insert-form').on('change', () => {
            $('#table-name').val($('#table-selector').find(":selected").text())
            $('#insert-form').submit();
        });

        $('#insert-form').submit();
    });
}

function buildDelete() {
    // Restore form
    if (cache.forms['delete-tab']) {
        $('#db-interface').html(cache.forms['delete-tab']);
        restoreSearchFormEvents(displayClickableData);
    } else {
        // Load form in delete mode
        loadSearchForm(displayClickableData, true);
    }

    // Restore data
    $('#data-section').find('table').remove();
    if (cache.tables['delete-tab']) {
        $('#data-section').append(cache.tables['delete-tab']);
    }

    // Register delete events
    deleteOnClick();
}

/* --------------------------------- Search --------------------------------- */
function loadSearchForm(callback, deleteFlag) {
    $('#db-interface').load('/search', () => {
        // Register the form
        asyncForm($('#search-form'), callback);

        // Load the tables names and fill the advanced options
        var namesUrl = '/get_table_names'
        if (deleteFlag) {
            namesUrl = '/get_delete_table_names'
        }
        $.ajax(namesUrl).done(data => {
            buildAdvancedOptions(data);
        });
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

/* --------------------------------- Insert --------------------------------- */
function createInsertCells(data) {
    $('#requested-table').empty();
    $('#insert-button').prop("disabled", false);

    for (var key in data) {
        // Generate placeholder
        placeHolder = key.replace('_ID', '')
        placeHolder = placeHolder.replace(/_/g, ' ')

        // Create text field
        searchCell = $('<input class="uk-input uk-form-width-medium" type="text">')
        searchCell.attr('name', key)
        searchCell.attr('placeholder', placeHolder)
        if (!data[key]['nullable']) {
            searchCell.addClass("uk-form-danger")
        }
        $('#requested-table').append(searchCell);

        // If it's a foreign key
        if (data[key]['case'] == 2 || data[key]['case'] == 3) {
            // Add the linked table
            searchCell.attr('foreign-table', data[key]['foreign_table'])
            searchCell.prop('insert-allowed', data[key]['insert_foreign_table'])

            searchCell.on('click', event => {
                // Display prompt on click
                UIkit.modal.prompt('Search a tuple in ' + $(event.currentTarget).attr('foreign-table') + ' by name or title', '')
                    .then(data => {
                        // If data is selected, set the field value
                        if (data) {
                            $(event.currentTarget).val(data);
                        }
                    });

                // Get elements
                var prompt = $('.uk-modal');
                var modal = $('.uk-modal-dialog');
                var input = modal.find('.uk-input');
                var body = $('<div class="uk-modal-body"></div>');
                var list = $('<ul class="uk-list uk-list-divider"></ul>');
                var foreignTable = $(event.currentTarget).attr('foreign-table');

                // Create structure
                var chars = 4;
                var info = 'Type at least ' + chars + ' characters to get autocomplete \
                            and click on a value to fill input. \
                            </br>';

                if (!$(event.currentTarget).prop('insert-allowed')) {
                    info += 'Note: Non existing values will be ignored during insertion.</br>'
                }

                body.html(info);
                modal.append(body);
                body.append(list);

                // Perform autocomplete
                input.on('input', (event) => autocomplete(event, { chars: chars, table: foreignTable, input: input, list: list }));
            });
        }

    };
}

function autocomplete(event, params) {
    var target = $(event.currentTarget);
    var input = params.input;
    var list = params.list;

    // If enough characters, start autocomplete
    if (target.val().length >= params.chars) {
        // Get matching tuples from server
        $.ajax('/autocomplete', {
            method: 'post',

            data: {
                value: target.val(),
                table: params.table
            },

            success: data => {
                // Display tuples and make them clickable
                list.empty();
                data.forEach((elem, idx) => {
                    var li = $('<li></li>').html(elem);
                    list.append(li);
                    li.on('click', () => {
                        input.val(elem);
                    })
                })
            }
        })
    }
}

function insertData(data) {
    console.log('success')
}

/* --------------------------------- Delete --------------------------------- */
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

/* ---------------------------- Data displaying ----------------------------- */

function displayData(tables) {
    // Clear existing tables
    $('#data-section').find('table').remove();

    // Append tables only if there are tuples
    tables.forEach(table => { appendTable(table[0], table[1], table[2]) })
}

function displayClickableData(data) {
    displayData(data);
    deleteOnClick();
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

/* --------------------------------- Others --------------------------------- */
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
