import { IdGenerator } from "../../application/ports/IdGenerator";

export class UuidGenerator implements IdGenerator {
  public generate(): string {
    return crypto.randomUUID();
  }
}
