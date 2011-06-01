// CodeCatalog Snippet http://www.codecatalog.net/355/1/
var floating_point_regexp = /^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
// End CodeCatalog Snippet

var javascript_grammar = {
    program: [ [ 'stmts' ] ],

    stmts: [ [ ], 
             [ 'stmt', 'more_stmts' ] ],

    more_stmts: [ [ ], 
                [ /^;/, 'stmts' ] ],

    stmt: [ [ 'var_decl' ] ],
    
    var_decl: [ [ 'var_keyword', /^\s+/, 'initializer_list' ] ],

    initializer_list: [ [ 'initializer' ],
                        [ 'initializer_list', /^,/, 'initializer' ] ],

    initializer: [ [ 'identifier', /^=/, 'expr' ] ],

    identifier: [ [ /^[a-zA-Z_$][\w$]*/ ] ],

    expr: [ [ 'assignment_expr' ] ],
    
    assignment_expr: [ [ 'operator_expr' ],
                       [ 'operator_expr', 'assignment_operator', 'assignment_expr' ] ],

    assignment_operator: [ [ /^[+*\/%-]?=/ ] ],

    // not modeling all precedence levels
    operator_expr: [ [ 'unary_expr' ],
                     [ 'unary_expr', 'operator', 'operator_expr' ] ],

    operator: [ [ /^(\+|-|\*|\/|%|==|!=|>|>=|<|<=|===|!==)/ ] ],

    unary_expr: [ [ 'atomic_expr' ],
                  [ 'prefix_operator', 'unary_expr' ] ],

    prefix_operator: [ [ /^(\+\+|--|\+|-)/ ] ],
    postfix_operator: [ [ /^(\+\+|--)/ ] ],

    atomic_expr: [ [ 'literal' ],
                   [ 'function_expr' ],
                   [ 'array_expr' ],
                   [ 'object_expr' ],
                   [ 'index_expr' ],
                   [ 'funcall_expr' ],
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
    more_arg_list: [ [ ], [ /^,/, 'identifier', 'more_arg_list' ] ],

    block: [ [ /^\{/, 'stmts', /^\}/ ] ],

    array_expr: [ [ /^\[/, 'expr_list', /^\]/ ] ],
    
    expr_list: [ [ ], [ 'expr', 'more_expr_list' ] ],
    more_expr_list: [ [ ], [ /^,/, 'expr', 'more_expr_list' ] ],

    object_expr: [ [ /^\{/, 'property_list', /^\}/ ] ],

    property_list: [ [ ], [ 'property_kv', 'more_property_list' ] ],
    more_property_list: [ [ ], [ /^,/, 'property_kv', 'more_property_list' ] ],

    property_kv: [ [ 'property_key', /^:/, 'expr' ] ],

    property_key: [ [ 'identifier' ],
                    [ 'literal' ] ],   // not exactly right.  eg. regexes can't be keys

    index_expr: [ [ 'atomic_expr', /^\[/, 'expr', /^\]/ ],
                  [ 'atomic_expr', /^\./, 'identifier' ] ],

    funcall_expr: [ [ 'atomic_expr', /^\(/, 'expr_list', /^\)/ ] ],

    var_keyword: [ [ /^var/ ] ],
    function_keyword: [ [ /^function/ ] ],
};
