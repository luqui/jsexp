// CodeCatalog Snippet http://www.codecatalog.net/355/1/
var floating_point_regexp = /^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
// End CodeCatalog Snippet

var javascript_grammar = {
    program: [ [ 'stmts' ] ],

    stmts: [ [ ], 
             [ 'stmt', 'more_stmts' ] ],

    more_stmts: [ [ ], 
                [ /^;/, 'stmts' ] ],

    stmt: [ [ 'var_decl' ],
            [ 'expr' ],
            [ 'block' ],
            [ 'return_stmt' ],
            [ 'void_stmt' ],
            [ 'for_stmt' ],
            [ 'foreach_stmt' ],
            [ 'if_stmt' ],
            [ 'function_stmt' ] ],

    return_stmt: [ [ 'return_keyword', /^\s+/, 'expr' ] ],
    void_stmt: [ [ 'void_keyword', /^\s+/, 'expr' ] ],

    function_stmt: [ [ 'function_keyword', /^\s+/, 'identifier', /^\(/, 'arg_list', /^\)/, 'block' ] ],

    // TODO what is the syntactic class of the first clause?
    for_stmt: [ [ 'for_keyword', /^\(/, 'stmt', /^;/, 'expr', /^;/, 'expr', /^\)/, 'stmt' ] ],
    foreach_stmt: [ [ 'for_keyword', /^\(/, 'foreach_var_decl', /^\s+/, 'in_keyword', 'expr', /^\)/, 'stmt' ] ],
    if_stmt: [ [ 'if_keyword', /^\(/, 'expr', /^\)/, 'stmt', 'else_clause' ] ],
    else_clause: [ [ ], [ 'else_keyword', 'stmt' ] ],

    foreach_var_decl: [ [ 'var_keyword', 'identifier' ],
                        [ 'identifier' ] ],
    
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

    operator: [ [ /^(\+|-|\*|\/|%|==|!=|>|>=|<|<=|===|!==|\|\||&&|in)/ ] ],

    unary_expr: [ [ 'atomic_expr' ],
                  [ 'prefix_operator', 'unary_expr' ] ],

    prefix_operator: [ [ /^(\+\+|--|\+|-|!)/ ] ],
    postfix_operator: [ [ /^(\+\+|--)/ ] ],

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
    more_arg_list: [ [ ], [ /^,/, 'identifier', 'more_arg_list' ] ],

    block: [ [ 'open_brace', 'stmts', /^\}/ ] ],

    array_expr: [ [ /^\[/, 'expr_list', /^\]/ ] ],
    
    expr_list: [ [ ], [ 'expr', 'more_expr_list' ] ],
    more_expr_list: [ [ ], [ /^,/, 'expr', 'more_expr_list' ] ],

    object_expr: [ [ 'open_brace', 'property_list', /^\}/ ] ],

    property_list: [ [ ], [ 'property_kv', 'more_property_list' ] ],
    more_property_list: [ [ ], [ /^,/, 'property_kv', 'more_property_list' ] ],

    property_kv: [ [ 'property_key', /^:/, 'expr' ] ],

    property_key: [ [ 'identifier' ],
                    [ 'literal' ] ],   // not exactly right.  eg. regexes can't be keys

    index_expr: [ [ 'atomic_expr', /^\[/, 'expr', /^\]/ ],
                  [ 'atomic_expr', /^\./, 'identifier' ] ],

    funcall_expr: [ [ 'atomic_expr', /^\(/, 'expr_list', /^\)/ ] ],

    variable: [ [ 'identifier' ] ],

    var_keyword: [ [ /^var/ ] ],
    function_keyword: [ [ /^function/ ] ],
    return_keyword: [ [ /^return/ ] ],
    void_keyword: [ [ /^void/ ] ],
    for_keyword: [ [ /^for/ ] ],
    in_keyword: [ [ /^in/ ] ],
    if_keyword: [ [ /^if/ ] ],
    else_keyword: [ [ /^else/ ] ],

    open_brace: [ [ /^{/ ] ],
};
