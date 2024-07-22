import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
    {
        input: 'src/index.ts',
        output: {
            dir: 'lib',
            format: 'cjs',
            sourcemap: false
        },
        plugins: [
            typescript({
                outDir: 'lib',
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
            file: 'lib/index.d.ts'
        },
        plugins: [dts()]
    }
];
