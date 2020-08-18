import { Typing } from "@saggitarius/typing"
import { Future } from "@saggitarius/future";
import { Metadata } from "@saggitarius/metadata"
import { Parser } from "@saggitarius/babel-parser";
import { ISourceLoader } from "@saggitarius/module-loader";

interface TypeData<T = unknown> extends Type<T> {
    metadata?: Metadata.Any;
}

export interface IMetadataParser {
    parse(type: Type): Promise<Metadata.Any>;
}
export namespace IMetadataParser {
    export const Type = Typing.type<IMetadataParser>("@saggitarius/metadata-parser::IMetadataParser");
}


@Typing.register("@saggitarius/metadata-parser::MetadataParser")
export class MetadataParser implements IMetadataParser {
    private parser = new Parser(["typescript", "classProperties", "decorators-legacy"]);
    private modulesMetadata = new Map<string, Future<Metadata.Module>>();

    public constructor(
        private sourceLoader: ISourceLoader,
    ) {}


    public async parse(type: Type): Promise<Metadata.Any> {
        debugger;
        const data = this.getTypeData(type);
        if (data.metadata === null) {
            return undefined;
        }
        if (!data.metadata) {
            data.metadata = null;
            if (data.path && data.module) {
                const module = await this.getModuleMetadata(data.module);
                data.metadata = this.getMetadata(module, data.path);
            }
        }
        return data.metadata;
    }

    private getMetadata(module: Metadata.Module, name: string): Metadata.Entry | null {
        return module.children.find((child) => child.name === name) || null;
    }

    private getModuleMetadata(module: string): Promise<Metadata.Module> {
        let md = this.modulesMetadata.get(module);
        if (!md) {
            md = new Future();
            this.modulesMetadata.set(module, md);
            this.loadModuleMetadata(module).then(
                (res) => md.set(res),
                (err) => md.fail(err),
            );
        }
        return md;
    }

    private async loadModuleMetadata(module: string): Promise<Metadata.Module> {
        const source = await this.sourceLoader.loadSource(module);
        return this.parser.parse(module, source);
    }

    private getTypeData<T>(t: Type<T>): TypeData<T> {
        return t;
    }
}
