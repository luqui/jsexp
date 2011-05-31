var javascript_grammar = {
    program: [ [ 'stmts' ] ],

    stmts: [ [ ], 
             [ 'stmt', 'more_stmts' ] ],

    more_stmts: [ [ ], 
                [ /^;/, 'stmts' ] ],

    stmt: [ [ 'var_decl' ] ],
    
    var_decl: [ [ /^var/, /^\s+/, 'initializer_list' ] ],

    initializer_list: [ [ 'initializer' ],
                        [ 'initializer_list', /^,/, 'initializer' ] ],

    initializer: [ [ 'identifier', /^=/, 'expr' ] ],

    identifier: [ [ /^[a-zA-Z_$][\w$]*/ ] ],

    expr: [ [ /^\d+/ ] ]
};
