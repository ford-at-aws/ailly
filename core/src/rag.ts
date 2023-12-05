import { LocalIndex } from "vectra";
import { Content } from "./content";
import { Plugin } from "./plugin";
import { join } from "node:path";

function ragDb(path: string) {
  return join(path, ".vectors");
}

export class RAG {
  index: LocalIndex;

  static async build(plugin: Plugin, path: string): Promise<RAG> {
    const rag = new RAG(plugin, ragDb(path));
    if (!(await rag.index.isIndexCreated())) await rag.index.createIndex();
    return rag;
  }

  private constructor(readonly plugin: Plugin, path: string) {
    this.index = new LocalIndex(path);
  }

  async add(content: Content) {
    const text = content.prompt;
    const vector = await this.plugin.vector(content.prompt, {});
    await this.index.insertItem({
      vector,
      metadata: { text },
    });
  }

  async augment(content: Content) {
    content.meta = content.meta ?? {};
    const vector = await this.plugin.vector(content.prompt, {});
    const results = await this.index.queryItems(vector, 3);
    content.meta.augment = results.map(({ score, item }) => ({
      score,
      content: item.metadata.text as string,
    }));
  }
}