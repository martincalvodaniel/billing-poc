import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { Client, ClientType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};

    // Build search filter if provided
    if (search && search.trim()) {
      // Search by name or taxId (case-insensitive)
      const searchPattern = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { name: searchPattern },
        { taxId: searchPattern },
      ];
    }

    const clients = await db
      .collection<Client>("clients")
      .find(filter)
      .sort({ name: 1 })
      .limit(10)
      .toArray();

    console.log(`Fetched ${clients.length} clients from database for filter: ${JSON.stringify(filter)}`);

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching clients: ${error}`);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientType, name, taxId, address } = body;

    // Validate required fields
    if (!clientType || !name || !taxId || !address) {
      return NextResponse.json(
        { error: "Missing required fields (clientType, name, taxId, address)" },
        { status: 400 }
      );
    }

    // Validate clientType
    if (clientType !== "individual" && clientType !== "company") {
      return NextResponse.json(
        { error: "clientType must be either 'individual' or 'company'" },
        { status: 400 }
      );
    }

    // Validate non-empty strings
    if (
      name.trim() === "" ||
      taxId.trim() === "" ||
      address.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Fields cannot be empty" },
        { status: 400 }
      );
    }

    const client: Omit<Client, "_id"> = {
      clientType: clientType as ClientType,
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    const result = await db.collection<Client>("clients").insertOne(client as Client);

    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error(`Error creating client: ${error}`);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, clientType, name, taxId, address } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Missing client ID" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Validate and add clientType if provided
    if (clientType !== undefined) {
      if (clientType !== "individual" && clientType !== "company") {
        return NextResponse.json(
          { error: "clientType must be either 'individual' or 'company'" },
          { status: 400 }
        );
      }
      updateData.clientType = clientType;
    }

    // Validate and add name if provided
    if (name !== undefined) {
      if (!name || name.trim() === "") {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    // Validate and add taxId if provided
    if (taxId !== undefined) {
      if (!taxId || taxId.trim() === "") {
        return NextResponse.json(
          { error: "Tax ID cannot be empty" },
          { status: 400 }
        );
      }
      updateData.taxId = taxId.trim();
    }

    // Validate and add address if provided
    if (address !== undefined) {
      if (!address || address.trim() === "") {
        return NextResponse.json(
          { error: "Address cannot be empty" },
          { status: 400 }
        );
      }
      updateData.address = address.trim();
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 1) {
      // Only updatedAt is present
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection<Client>("clients").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error updating client: ${error}`);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Missing client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection<Client>("clients").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting client: ${error}`);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
