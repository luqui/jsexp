// CodeCatalog Snippet http://www.codecatalog.net/355/1/
var floating_point_regexp = /^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/357/2/
var escape_for_regexp = function(text) {
    return text.replace(/[][\\^$*+?{}\.()|]/g, function(x) { '\\' + x });
};
// End CodeCatalog Snippet

var Token = {
    space_after: function(text) {
        return {
            pattern: new RegExp('^' + escape_for_regexp(text) + '\\s*'),
            text: text + ' '
        }
    },
	no_space_after_rx: function(rx) {
		return {
			pattern: new RegExp('^(' + rx.source + ')\\s*'),
			text: function(m) { return m[1] }
		}
	},
	no_space_before_rx: function(rx) {
		return {
			pattern: new RegExp('^\\s*(' + rx.source + ')'),
			text: function(m) { return m[1] }
		}
	},
    space_padded_rx: function(rx) {
        return {
            pattern: new RegExp('^\\s*(' + rx.source + ')\\s*'),
            text: function(m) { return ' ' + m[1] + ' ' }
        }
    },
	newline_after: function(text) {
		return {
			pattern: new RegExp('^' + escape_for_regexp(text) + '\\s*'),
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

    function_stmt: [ [ 'function_keyword', 'identifier', /^\(/, 'arg_list', /^\)/, 'block' ] ],

    // TODO what is the syntactic class of the first clause?
    for_stmt: [ [ 'for_keyword', /^\(/, 'stmt', /^;/, 'expr', /^;/, 'expr', /^\)/, 'stmt' ] ],
    foreach_stmt: [ [ 'for_keyword', /^\(/, 'foreach_var_decl', /^\s+/, 'in_keyword', 'expr', /^\)/, 'stmt' ] ],
    if_stmt: [ [ 'if_keyword', /^\(/, 'expr', /^\)/, 'stmt', 'else_clause' ] ],
    else_clause: [ [ ], [ 'else_keyword', 'stmt' ] ],

    foreach_var_decl: [ [ 'var_keyword', 'identifier' ],
                        [ 'identifier' ] ],
    
    var_decl: [ [ 'var_keyword', 'initializer_list' ] ],

    initializer_list: [ [ 'initializer' ],
                        [ 'initializer_list', Token.space_after(','), 'initializer' ] ],

    initializer: [ [ 'identifier', Token.space_padded_rx(/=/), 'expr' ] ],

    identifier: [ [ /^[a-zA-Z_$][\w$]*/ ] ],

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

    prefix_operator: [ [ Token.no_space_after_rx(/^(\+\+|--|\+|-|!)/) ] ],
    postfix_operator: [ [ Token.no_space_before_rx(/^(\+\+|--)/) ] ],

    atomic_expr: [ [ 'literal' ],
                   [ 'function_expr' ],
                   [ 'array_expr' ],
                   [ 'object_expr' ],
                   [ 'index_expr' ],
                   [ 'funcall_expr' ],
                   [ 'variable' ],
                   [ /^\(/, 'expr', /^\)/ ] ],

    literal: [ [ floating_point_regexp ],
               [ /^"/, 'dq_string', /^"/ ],
               [ /^'/, 'sq_string', /^'/ ],
               [ /\//, 'slash_string', /\// ] ],

    dq_string: [ [ /^[^"\\]*(\\.[^"\\]*)*/ ] ],
    sq_string: [ [ /^[^'\\]*(\\.[^'\\]*)*/ ] ],
    slash_string: [ [ /^[^\/\\]*(\\.[^\/\\]*)*/ ] ],
    
    function_expr: [ [ 'function_keyword', /^\(/, 'arg_list', /^\)/, 'block' ] ],
    arg_list: [ [ ], [ 'identifier', 'more_arg_list' ] ],
    more_arg_list: [ [ ], [ Token.space_after(','), 'identifier', 'more_arg_list' ] ],

    block: [ [ /^\{/, 'stmts', /^\}/ ] ],

    array_expr: [ [ /^\[/, 'expr_list', /^\]/ ] ],
    
    expr_list: [ [ ], [ 'expr', 'more_expr_list' ] ],
    more_expr_list: [ [ ], [ Token.space_after(','), 'expr', 'more_expr_list' ] ],

    object_expr: [ [ /^\{/, 'property_list', /^\}/ ] ],

    property_list: [ [ ], [ 'property_kv', 'more_property_list' ] ],
    more_property_list: [ [ ], [ /^,/, 'property_kv', 'more_property_list' ] ],

    property_kv: [ [ 'property_key', /^:/, 'expr' ] ],

    property_key: [ [ 'identifier' ],
                    [ 'literal' ] ],   // not exactly right.  eg. regexes can't be keys

    index_expr: [ [ 'atomic_expr', /^\[/, 'expr', /^\]/ ],
                  [ 'atomic_expr', /^\./, 'identifier' ] ],

    funcall_expr: [ [ 'atomic_expr', /^\(/, 'expr_list', /^\)/ ] ],

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
