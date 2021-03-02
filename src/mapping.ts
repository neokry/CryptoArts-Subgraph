import { BigInt, Bytes, ipfs, json, log } from "@graphprotocol/graph-ts";
import {
  Contract,
  Approval,
  ApprovalForAll,
  ArtworkCreated,
  ArtworkSold,
  Transfer,
  ArtworkPriceSet,
} from "../generated/Contract/Contract";
import { Artwork } from "../generated/schema";

// Note: If a handler doesn't require existing field values, it is faster
// _not_ to load the entity from the store. Instead, create it fresh with
// `new Entity(...)`, set the fields that should be updated and save the
// entity back to the store. Fields that were not set or unset remain
// unchanged, allowing for partial updates to be applied.

// It is also possible to access smart contracts from mappings. For
// example, the contract that has emitted the event can be connected to
// with:
//
// let contract = Contract.bind(event.address)
//
// The following functions can then be called on this contract to access
// state variables and other data:
//
// - contract.artworkToCurrentPrice(...)
// - contract.balanceOf(...)
// - contract.baseURI(...)
// - contract.failedTransferCredits(...)
// - contract.getApproved(...)
// - contract.isApprovedForAll(...)
// - contract.name(...)
// - contract.ownerOf(...)
// - contract.platform(...)
// - contract.supportsInterface(...)
// - contract.symbol(...)
// - contract.tokenByIndex(...)
// - contract.tokenOfOwnerByIndex(...)
// - contract.tokenURI(...)
// - contract.totalSupply(...)

export function handleApproval(event: Approval): void {}

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleArtworkCreated(event: ArtworkCreated): void {
  let id = event.params.artworkId.toHex();
  let artwork = new Artwork(id);

  artwork.owner = event.params.artist;
  artwork.artist = event.params.artist;
  artwork.currentPrice = event.params.price;

  let contract = Contract.bind(event.address);
  let tokenURI = contract.tokenURI(event.params.artworkId);
  log.info("Token uri {}", [tokenURI]);

  let data = ipfs.cat(tokenURI);

  if (data) {
    let value = json.fromBytes(data as Bytes);
    let obj = value.toObject();
    artwork.name = obj.getEntry("name").value.toString();
    artwork.description = obj.getEntry("description").value.toString();
    artwork.image = obj.getEntry("image").value.toString();
  } else {
    log.error("Error no data for token URI {}", [tokenURI]);
  }

  artwork.save();
}

export function handleArtworkSold(event: ArtworkSold): void {
  let id = event.params.artworkId.toHex();
  let artwork = new Artwork(id);

  artwork.owner = event.params.newOwner;

  if (artwork.soldPriceHistory == null) {
    artwork.soldPriceHistory = [event.params.price];
  } else {
    artwork.soldPriceHistory.push(event.params.price);
  }

  artwork.currentPrice = BigInt.fromI32(0);

  artwork.save();
}

export function handleArtworkPriceSet(event: ArtworkPriceSet): void {
  let id = event.params.artworkId.toHex();
  let artwork = new Artwork(id);

  artwork.currentPrice = event.params.price;

  artwork.save();
}

export function handleTransfer(event: Transfer): void {}
