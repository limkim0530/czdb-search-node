import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
    {
        input: 'src/index.ts',
        output: [{
            file: 'dist/index.cjs',
            format: 'cjs',
            sourcemap: false,
            exports: 'named',
        }, {
            file: 'dist/es/index.mjs',
            format: 'es',
            sourcemap: false
        }],
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: false,
                    removeComments: true
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
