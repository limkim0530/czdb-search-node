import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
    {
        input: 'src/index.ts',
        output: [{
            dir: 'dist',
            format: 'cjs',
            sourcemap: false,
            exports: 'named',
        }, {
            dir: 'dist/es',
            format: 'es',
            sourcemap: false
        }],
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: false,
                    removeComments: true,
                    module: 'es6'
                }
            })
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts'
        },
        plugins: [dts()]
    }
];
