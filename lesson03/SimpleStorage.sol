// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; 

contract SimpleStorage {
    bytes32 foo; // a sequence of 32 bytes

    struct Person {
        string name;
        uint256 favoriteNumber;
    }

    Person public person = Person({name: "George", favoriteNumber: 2});
    
    // dynamic array since we don't specify a size here
    Person[] public people;

    // fixed size array
    // each element in array gets initialized to a Person struct with default values: empty string for name,
    // and 0 for favorite number
    Person[3] public threePeople;

    mapping(string => uint256) public nameToFavoriteNumber;

    function updateThreePeople(uint index, Person memory _person) public {
        require(index < 3, "Index must be less than 3");
        threePeople[index] = _person;
    }

    // with identical arguments, memory version of call is much cheaper than calldata version
    function addPersonMemory(Person memory _person) public {
        people.push(_person);
        nameToFavoriteNumber[_person.name] = _person.favoriteNumber;
    }

    // with identical arguments, calldata version of call is much more expensive than memory version
    function addPersonCalldata(Person calldata _person) public {
        people.push(_person);
        nameToFavoriteNumber[_person.name] = _person.favoriteNumber;
    }

    function isLength32() public view returns (bool) {
        return foo.length == 32;
    }
    function isLength8() public view returns (bool) {
        return foo.length == 8;
    }

    uint256 public favoriteNumber;

    function store(uint256 _favoriteNumber) public virtual {
        favoriteNumber = _favoriteNumber;
    }

    function retrieve_fave_number() public view returns (uint256) {
        return favoriteNumber;
    }
}