import * as fs from 'fs';
import * as path from 'path';

import { ContractSource } from '../types';

import { EnumerableResolver } from './enumerable_resolver';

const SOLIDITY_FILE_EXTENSION = '.sol';

export class NameResolver extends EnumerableResolver {
    private readonly _contractsDir: string;
    constructor(contractsDir: string) {
        super();
        this._contractsDir = contractsDir;
    }
    public resolveIfExists(lookupContractName: string): ContractSource | undefined {
        console.log('this._contractsDir', this._contractsDir);
        console.log('resolveIfExists', lookupContractName);
        let contractSource: ContractSource | undefined;
        const onFile = (filePath: string) => {
            console.log('onFile', filePath);
            const contractName = path.basename(filePath, SOLIDITY_FILE_EXTENSION);
            if (contractName === lookupContractName) {
                const absoluteContractPath = path.join(this._contractsDir, filePath);
                const source = fs.readFileSync(absoluteContractPath).toString();
                contractSource = { source, path: filePath, absolutePath: absoluteContractPath };
                return true;
            }
            return undefined;
        };
        this._traverseContractsDir(this._contractsDir, onFile);
        return contractSource;
    }
    public getAll(): ContractSource[] {
        const contractSources: ContractSource[] = [];
        const onFile = (filePath: string) => {
            const absoluteContractPath = path.join(this._contractsDir, filePath);
            const source = fs.readFileSync(absoluteContractPath).toString();
            const contractSource = { source, path: filePath, absolutePath: absoluteContractPath };
            contractSources.push(contractSource);
        };
        this._traverseContractsDir(this._contractsDir, onFile);
        return contractSources;
    }
    // tslint:disable-next-line:prefer-function-over-method
    private _traverseContractsDir(dirPath: string, onFile: (filePath: string) => true | void): boolean {
        console.log('dirPath', dirPath);
        let dirContents: string[] = [];
        try {
            dirContents = fs.readdirSync(dirPath);
        } catch (err) {
            throw new Error(`No directory found at ${dirPath}`);
        }
        for (const fileName of dirContents) {
            const absoluteEntryPath = path.resolve(dirPath, fileName);
            const isDirectory = fs.lstatSync(absoluteEntryPath).isDirectory();
            console.log('this._contractsDir', this._contractsDir, 'absoluteEntryPath', absoluteEntryPath);
            const entryPath = path.relative(this._contractsDir, absoluteEntryPath);
            console.log('entryPath', entryPath);
            let isComplete;
            if (isDirectory) {
                isComplete = this._traverseContractsDir(absoluteEntryPath, onFile);
            } else if (fileName.endsWith(SOLIDITY_FILE_EXTENSION)) {
                isComplete = onFile(entryPath);
            }
            if (isComplete) {
                return isComplete;
            }
        }
        return false;
    }
}
