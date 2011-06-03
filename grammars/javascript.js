// CodeCatalog Snippet http://www.codecatalog.net/355/1/
var floating_point_regexp = /^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/357/3/
var escape_for_regexp = function(text) {
    return text.replace(/[\]\[\\^$*+?{}\.()|]/g, function(x) { return '\\' + x });
};
// End CodeCatalog Snippet

var Token = {
    space_after: function(text) {
        return {
            pattern: escape_for_regexp(text) + '\\s*',
            text: text + ' '
        }
    },
    rx: function(rx) {
        return {
            pattern: rx.source
        }
    },
    string: function(text) {
        return {
            pattern: escape_for_regexp(text)
        }
    },
	no_space_after_rx: function(rx) {
		return {
			pattern: '(' + rx.source + ')\\s*',
			text: function(m) { return m[1] }
		}
	},
	no_space_before_rx: function(rx) {
		return {
			pattern: '\\s*(' + rx.source + ')',
			text: function(m) { return m[1] }
		}
	},
    space_padded_rx: function(rx) {
        return {
            pattern: '\\s*(' + rx.source + ')\\s*',
            text: function(m) { return ' ' + m[1] + ' ' }
        }
    },
	newline_after: function(text) {
		return {
			pattern: escape_for_regexp(text) + '\\s*',
			text: text + '\n'
		}
	},
};

var javascript_grammar = {
    program: [ [ 'stmts' ] ],

    stmts: [ [ ], 
             [ 'stmt', 'more_stmts' ] ],

    more_stmts: [ [ ], 
                [ Token.newline_after(';'), 'stmts' ] ],

    stmt: [ [ 'var_decl' ],
            [ 'expr' ],
            [ 'block' ],
            [ 'return_stmt' ],
            [ 'void_stmt' ],
            [ 'for_stmt' ],
            [ 'foreach_stmt' ],
            [ 'if_stmt' ],
            [ 'function_stmt' ] ],

    return_stmt: [ [ 'return_keyword', 'expr' ] ],
    void_stmt: [ [ 'void_keyword', 'expr' ] ],

    function_stmt: [ [ 'function_keyword', 'identifier', Token.string('('), 'arg_list', Token.string(')'), 'block' ] ],

    // TODO what is the syntactic class of the first clause?
    for_stmt: [ [ 'for_keyword', Token.string('('), 'stmt', Token.string(')'), 'expr', Token.string(';'), 'expr', Token.string(')'), 'stmt' ] ],
    foreach_stmt: [ [ 'for_keyword', Token.string('('), 'foreach_var_decl', Token.rx(/\s+/), 'in_keyword', 'expr', Token.string(')'), 'stmt' ] ],
    if_stmt: [ [ 'if_keyword', Token.string('('), 'expr', Token.string(')'), 'stmt', 'else_clause' ] ],
    else_clause: [ [ ], [ 'else_keyword', 'stmt' ] ],

    foreach_var_decl: [ [ 'var_keyword', 'identifier' ],
                        [ 'identifier' ] ],
    
    var_decl: [ [ 'var_keyword', 'initializer_list' ] ],

    initializer_list: [ [ 'initializer' ],
                        [ 'initializer_list', Token.space_after(','), 'initializer' ] ],

    initializer: [ [ 'identifier', Token.space_padded_rx(/=/), 'expr' ] ],

    identifier: [ [ Token.rx(/[a-zA-Z_$][\w$]*/) ] ],

    expr: [ [ 'assignment_expr' ] ],
    
    assignment_expr: [ [ 'operator_expr' ],
                       [ 'operator_expr', 'assignment_operator', 'assignment_expr' ] ],

    assignment_operator: [ [ Token.space_padded_rx(/[+*\/%-]?=/) ] ],

    // not modeling all precedence levels
    operator_expr: [ [ 'unary_expr' ],
                     [ 'unary_expr', 'operator', 'operator_expr' ] ],

    operator: [ [ Token.space_padded_rx(/(\+|-|\*|\/|%|==|!=|>|>=|<|<=|===|!==|\|\||&&|in)/) ] ],

    unary_expr: [ [ 'atomic_expr' ],
                  [ 'prefix_operator', 'unary_expr' ] ],

    prefix_operator: [ [ Token.no_space_after_rx(/(\+\+|--|\+|-|!)/) ] ],
    postfix_operator: [ [ Token.no_space_before_rx(/(\+\+|--)/) ] ],

    atomic_expr: [ [ 'literal' ],
                   [ 'function_expr' ],
                   [ 'array_expr' ],
                   [ 'object_expr' ],
                   [ 'index_expr' ],
                   [ 'funcall_expr' ],
                   [ 'variable' ],
                   [ Token.string('('), 'expr', Token.string(')') ] ],

    literal: [ [ Token.rx(floating_point_regexp) ],
               [ Token.string('"'), 'dq_string', Token.string('"') ],
               [ Token.string("'"), 'sq_string', Token.string("'") ],
               [ Token.string('/'), 'slash_string', Token.string('/') ] ],

    dq_string: [ [ Token.rx(/^[^"\\]*(\\.[^"\\]*)*/) ] ],
    sq_string: [ [ Token.rx(/^[^'\\]*(\\.[^'\\]*)*/) ] ],
    slash_string: [ [ Token.rx(/^[^\/\\]*(\\.[^\/\\]*)*/) ] ],
    
    function_expr: [ [ 'function_keyword', Token.string('('), 'arg_list', Token.string(')'), 'block' ] ],
    arg_list: [ [ ], [ 'identifier', 'more_arg_list' ] ],
    more_arg_list: [ [ ], [ Token.space_after(','), 'identifier', 'more_arg_list' ] ],

    block: [ [ Token.string('{'), 'stmts', Token.string('}') ] ],

    array_expr: [ [ Token.string('['), 'expr_list', Token.string(']') ] ],
    
    expr_list: [ [ ], [ 'expr', 'more_expr_list' ] ],
    more_expr_list: [ [ ], [ Token.space_after(','), 'expr', 'more_expr_list' ] ],

    object_expr: [ [ Token.string('{'), 'property_list', Token.string('}') ] ],

    property_list: [ [ ], [ 'property_kv', 'more_property_list' ] ],
    more_property_list: [ [ ], [ Token.string(','), 'property_kv', 'more_property_list' ] ],

    property_kv: [ [ 'property_key', Token.string(':'), 'expr' ] ],

    property_key: [ [ 'identifier' ],
                    [ 'literal' ] ],   // not exactly right.  eg. regexes can't be keys

    index_expr: [ [ 'atomic_expr', Token.string('['), 'expr', Token.string(']') ],
                  [ 'atomic_expr', Token.string('.'), 'identifier' ] ],

    funcall_expr: [ [ 'atomic_expr', Token.string('('), 'expr_list', Token.string(')') ] ],

    variable: [ [ 'identifier' ] ],

    var_keyword: [ [ Token.space_after('var') ] ],
    function_keyword: [ [ Token.space_after('function') ] ],
    return_keyword: [ [ Token.space_after('return') ] ],
    void_keyword: [ [ Token.space_after('void') ] ],
    for_keyword: [ [ Token.space_after('for') ] ],
    in_keyword: [ [ Token.space_after('in') ] ],
    if_keyword: [ [ Token.space_after('if') ] ],
    else_keyword: [ [ Token.space_after('else') ] ],
};
